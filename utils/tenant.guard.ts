import Branch from "../models/Branch";
import UserCompanyAccess from "../models/UserCompanyAccess";
import type { IBranch } from "../models/Branch";
import type { IUserCompanyAccess, CompanyRole } from "../models/UserCompanyAccess";
import { ForbiddenError, NotFoundError } from "./errors";

export interface TenantContext {
  branch: IBranch;
  access: IUserCompanyAccess;
}

/**
 * Verifica que:
 * 1. La branch existe y está activa.
 * 2. El usuario pertenece a la empresa dueña de esa branch.
 * 3. El usuario tiene acceso a esa branch (lista explícita o allBranches).
 *
 * Usar en servicios y rutas de recursos bajo /branches/:branchId/*.
 */
export async function assertBranchAccess(
  branchId: string,
  userId: string
): Promise<TenantContext> {
  const branch = await Branch.findOne({ _id: branchId, active: true });
  if (!branch) throw new NotFoundError("Branch not found");

  const access = await UserCompanyAccess.findOne({
    user: userId,
    company: branch.company,
    active: true,
    $or: [{ branches: branchId }, { allBranches: true }],
  });
  if (!access) throw new ForbiddenError("Access denied to this branch");

  return { branch, access };
}

/**
 * Como assertBranchAccess pero además exige que el usuario tenga
 * uno de los roles indicados en esa empresa.
 */
export async function assertBranchRole(
  branchId: string,
  userId: string,
  roles: CompanyRole[]
): Promise<TenantContext> {
  const ctx = await assertBranchAccess(branchId, userId);
  if (!roles.includes(ctx.access.role)) {
    throw new ForbiddenError("Insufficient permissions for this operation");
  }
  return ctx;
}
