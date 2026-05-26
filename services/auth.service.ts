import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User";
import Company from "../models/Company";
import Branch from "../models/Branch";
import UserCompanyAccess from "../models/UserCompanyAccess";
import { env } from "../config/env.config";
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
} from "../utils/errors";
import type { RegisterDto, LoginDto } from "../validators/auth.validator";

const SALT_ROUNDS = 12;
const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

export { REFRESH_COOKIE_MAX_AGE };

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function generateAccessToken(payload: {
  userId: string;
  role: string;
  companyId?: string;
  branchId?: string;
}): string {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  } as jwt.SignOptions);
}

function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId }, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpiresIn,
  } as jwt.SignOptions);
}

export async function register(dto: RegisterDto) {
  const existing = await User.findOne({ email: dto.email });
  if (existing) throw new ConflictError("Email already registered");

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const [user] = await User.create(
      [{ name: dto.name, email: dto.email, password: hashedPassword, role: "admin" }],
      { session }
    );

    const [company] = await Company.create(
      [{ name: dto.companyName, taxId: dto.taxId, owner: user._id }],
      { session }
    );

    const [branch] = await Branch.create(
      [{ name: `${dto.companyName} - Principal`, company: company._id }],
      { session }
    );

    await UserCompanyAccess.create(
      [{ user: user._id, company: company._id, branches: [branch._id], role: "admin" }],
      { session }
    );

    await session.commitTransaction();

    const companyId = String(company._id);
    const branchId = String(branch._id);

    const accessToken = generateAccessToken({
      userId: String(user._id),
      role: user.role,
      companyId,
      branchId,
    });

    const refreshToken = generateRefreshToken(String(user._id));

    await User.findByIdAndUpdate(user._id, {
      refreshToken: hashToken(refreshToken),
      lastLogin: new Date(),
    });

    return {
      accessToken,
      refreshToken,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      company: { id: company._id, name: company.name },
      branch: { id: branch._id, name: branch.name },
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

export async function login(dto: LoginDto) {
  const user = await User.findOne({ email: dto.email, active: true }).select(
    "+password +refreshToken"
  );
  if (!user) throw new UnauthorizedError("Invalid credentials");

  const valid = await bcrypt.compare(dto.password, user.password);
  if (!valid) throw new UnauthorizedError("Invalid credentials");

  const access = await UserCompanyAccess.findOne({ user: user._id, active: true })
    .sort({ createdAt: 1 })
    .lean();

  const companyId = access?.company ? String(access.company) : undefined;
  const branchId = access?.branches?.[0] ? String(access.branches[0]) : undefined;

  const accessToken = generateAccessToken({
    userId: String(user._id),
    role: user.role,
    companyId,
    branchId,
  });

  const refreshToken = generateRefreshToken(String(user._id));

  await User.findByIdAndUpdate(user._id, {
    refreshToken: hashToken(refreshToken),
    lastLogin: new Date(),
  });

  return {
    accessToken,
    refreshToken,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
    companyId,
    branchId,
  };
}

export async function refresh(token: string) {
  let payload: { userId: string };
  try {
    payload = jwt.verify(token, env.jwtRefreshSecret) as { userId: string };
  } catch {
    throw new UnauthorizedError("Invalid or expired refresh token");
  }

  const user = await User.findById(payload.userId).select("+refreshToken");
  if (!user || !user.active) throw new UnauthorizedError("Session expired");
  if (!user.refreshToken || user.refreshToken !== hashToken(token)) {
    throw new UnauthorizedError("Invalid refresh token");
  }

  const access = await UserCompanyAccess.findOne({ user: user._id, active: true })
    .sort({ createdAt: 1 })
    .lean();

  const accessToken = generateAccessToken({
    userId: String(user._id),
    role: user.role,
    companyId: access?.company ? String(access.company) : undefined,
    branchId: access?.branches?.[0] ? String(access.branches[0]) : undefined,
  });

  return { accessToken };
}

export async function logout(userId: string): Promise<void> {
  await User.findByIdAndUpdate(userId, { $unset: { refreshToken: 1 } });
}

export async function getProfile(userId: string) {
  const user = await User.findById(userId).select("-password -refreshToken");
  if (!user) throw new NotFoundError("User not found");

  const accesses = await UserCompanyAccess.find({ user: userId, active: true })
    .populate<{ company: { _id: unknown; name: string; active: boolean } }>("company", "name taxId address phone email logo active")
    .populate({ path: "branches", match: { active: true }, select: "name address phone" })
    .lean();

  // Excluir empresas eliminadas (company.active = false) cuyo UserCompanyAccess aún no fue desactivado
  const activeAccesses = accesses.filter((a) => a.company && (a.company as any).active !== false);

  return { user, companies: activeAccesses };
}
