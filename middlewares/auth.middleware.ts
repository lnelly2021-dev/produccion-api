import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.config";
import { UnauthorizedError, ForbiddenError } from "../utils/errors";
import type { UserRole } from "../models/User";
import type { CompanyRole } from "../models/UserCompanyAccess";

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
    }
  }
}

export const authMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const header = req.headers.authorization;
  const bearer = header?.startsWith("Bearer ") ? header.slice(7) : null;
  const cookieToken = req.cookies?.token as string | undefined;
  const token = bearer || cookieToken;

  if (!token) {
    return next(new UnauthorizedError("Authentication token required"));
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as AuthPayload;
    req.user = decoded;
    next();
  } catch {
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
