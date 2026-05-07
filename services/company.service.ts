import Company from "../models/Company";
import User from "../models/User";
import UserCompanyAccess from "../models/UserCompanyAccess";
import { NotFoundError, ForbiddenError, ConflictError } from "../utils/errors";
import type { CreateCompanyDto, UpdateCompanyDto } from "../validators/company.validator";
import type { CompanyRole } from "../models/UserCompanyAccess";

// ── helpers ──────────────────────────────────────────────────────────────────

async function assertAdmin(companyId: string, userId: string) {
  const access = await UserCompanyAccess.findOne({
    user: userId,
    company: companyId,
    role: "admin",
    active: true,
  });
  if (!access) throw new ForbiddenError("Only company admins can perform this action");
  return access;
}

// ── company CRUD ──────────────────────────────────────────────────────────────

export async function create(ownerId: string, dto: CreateCompanyDto) {
  if (dto.taxId) {
    const existing = await Company.findOne({ taxId: dto.taxId });
    if (existing) throw new ConflictError("A company with this Tax ID already exists");
  }

  const company = await Company.create({ ...dto, owner: ownerId });

  await UserCompanyAccess.create({
    user: ownerId,
    company: company._id,
    branches: [],
    allBranches: true,
    role: "admin",
  });

  return company;
}

export async function findByUser(userId: string) {
  const accesses = await UserCompanyAccess.find({ user: userId, active: true })
    .populate<{ company: InstanceType<typeof Company> }>("company")
    .lean();

  return accesses
    .filter((a) => a.company && (a.company as any).active !== false)
    .map((a) => ({ ...(a.company as any), accessRole: a.role }));
}

export async function findById(companyId: string, userId: string) {
  const company = await Company.findById(companyId);
  if (!company || !company.active) throw new NotFoundError("Company not found");

  const access = await UserCompanyAccess.findOne({
    user: userId,
    company: companyId,
    active: true,
  });
  if (!access) throw new ForbiddenError("Access denied to this company");

  return company;
}

export async function update(companyId: string, userId: string, dto: UpdateCompanyDto) {
  await assertAdmin(companyId, userId);

  if (dto.taxId) {
    const existing = await Company.findOne({ taxId: dto.taxId, _id: { $ne: companyId } });
    if (existing) throw new ConflictError("A company with this Tax ID already exists");
  }

  return Company.findByIdAndUpdate(companyId, dto, { new: true, runValidators: true });
}

export async function softDelete(companyId: string, userId: string) {
  await assertAdmin(companyId, userId);
  await Company.findByIdAndUpdate(companyId, { active: false });
}

// ── members ───────────────────────────────────────────────────────────────────

export async function listMembers(companyId: string, requesterId: string) {
  await findById(companyId, requesterId);

  return UserCompanyAccess.find({ company: companyId, active: true })
    .populate("user", "name email role active")
    .populate("branches", "name address")
    .lean();
}

export async function addMember(
  companyId: string,
  requesterId: string,
  email: string,
  role: CompanyRole,
  branchIds: string[] = [],
  allBranches: boolean = false
) {
  await assertAdmin(companyId, requesterId);

  const targetUser = await User.findOne({ email: email.toLowerCase(), active: true });
  if (!targetUser) throw new NotFoundError(`No registered user found with email: ${email}`);

  const existing = await UserCompanyAccess.findOne({
    user: targetUser._id,
    company: companyId,
  });

  if (existing) {
    existing.role = role;
    existing.branches = branchIds as any;
    existing.allBranches = allBranches;
    existing.active = true;
    await existing.save();
    return existing.populate(["user", "branches"]);
  }

  const access = await UserCompanyAccess.create({
    user: targetUser._id,
    company: companyId,
    branches: branchIds,
    allBranches,
    role,
  });

  return access.populate(["user", "branches"]);
}

export async function updateMember(
  companyId: string,
  requesterId: string,
  targetUserId: string,
  updates: { role?: CompanyRole; branchIds?: string[]; allBranches?: boolean }
) {
  await assertAdmin(companyId, requesterId);

  const memberAccess = await UserCompanyAccess.findOne({
    user: targetUserId,
    company: companyId,
    active: true,
  });
  if (!memberAccess) throw new NotFoundError("Member not found in this company");

  if (updates.role !== undefined) memberAccess.role = updates.role;
  if (updates.branchIds !== undefined) memberAccess.branches = updates.branchIds as any;
  if (updates.allBranches !== undefined) memberAccess.allBranches = updates.allBranches;

  await memberAccess.save();
  return memberAccess.populate(["user", "branches"]);
}

export async function removeMember(
  companyId: string,
  requesterId: string,
  targetUserId: string
) {
  await assertAdmin(companyId, requesterId);

  const result = await UserCompanyAccess.findOneAndUpdate(
    { user: targetUserId, company: companyId, active: true },
    { active: false }
  );
  if (!result) throw new NotFoundError("Member not found in this company");
}
