import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.config";
import { UnauthorizedError, ForbiddenError } from "../utils/errors";
import User from "../models/User";
import type { UserRole } from "../models/User";
import type { CompanyRole, IUserCompanyAccess } from "../models/UserCompanyAccess";
import type { IBranch } from "../models/Branch";

export interface AuthPayload {
  userId: string;
  role: UserRole;
  companyId?: string;
  branchId?: string;
  [key: string]: unknown;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
      tenant?: { branch: IBranch; access: IUserCompanyAccess };
    }
  }
}

export const authMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const header = req.headers.authorization;
  const bearer = header?.startsWith("Bearer ") ? header.slice(7) : null;
  const cookieToken = req.cookies?.token as string | undefined;
  const token = bearer || cookieToken;

  if (!token) {
    return next(new UnauthorizedError("Authentication token required"));
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as AuthPayload;

    // Verificar que el usuario sigue activo en la base de datos.
    // Previene el uso de tokens válidos de cuentas desactivadas.
    const userExists = await User.exists({ _id: decoded.userId, active: true });
    if (!userExists) {
      return next(new UnauthorizedError("Account is inactive or does not exist"));
    }

    req.user = decoded;
    next();
  } catch (err) {
    if (err instanceof UnauthorizedError) return next(err);
    next(new UnauthorizedError("Invalid or expired token"));
  }
};

export const requireRole = (allowed: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !allowed.includes(req.user.role)) {
      return next(new ForbiddenError("Insufficient permissions"));
    }
    next();
  };
};

export const requireCompanyRole = (allowed: CompanyRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(new UnauthorizedError("Authentication required"));
    if (!req.user.companyId) return next(new ForbiddenError("No company context"));

    const role = req.user.role as string;
    if (role === "superadmin") {
      next();
      return;
    }

    if (!allowed.includes(role as CompanyRole)) {
      return next(new ForbiddenError("Insufficient company permissions"));
    }
    next();
  };
};
