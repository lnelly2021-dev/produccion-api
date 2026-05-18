import { Request, Response, NextFunction } from "express";
import { assertBranchAccess } from "../utils/tenant.guard";

/**
 * Middleware de seguridad para todas las rutas bajo /branches/:branchId/*.
 *
 * Valida en un solo paso que:
 *   1. La branch existe y está activa.
 *   2. El usuario pertenece a la empresa dueña de esa branch.
 *   3. El usuario tiene acceso a esa branch (lista explícita o allBranches).
 *
 * Adjunta { branch, access } en req.tenant para que los handlers puedan
 * reutilizarlo sin repetir la query.
 *
 * Montado en index.ts ANTES de los app.use de las subrutas:
 *   app.use(`/api/v1/branches/:branchId`, authMiddleware, branchAccessMiddleware);
 */
export const branchAccessMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const branchId = String(req.params.branchId);
    if (!branchId) return next();
    req.tenant = await assertBranchAccess(branchId, req.user!.userId);
    next();
  } catch (err) {
    next(err);
  }
};
