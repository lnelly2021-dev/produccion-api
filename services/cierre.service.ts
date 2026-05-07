import Cierre from "../models/Cierre";
import UserCompanyAccess from "../models/UserCompanyAccess";
import { ForbiddenError } from "../utils/errors";

async function assertAccess(branchId: string, userId: string) {
  const access = await UserCompanyAccess.findOne({ user: userId, branches: branchId, active: true });
  if (!access) throw new ForbiddenError("Access denied");
}

export async function listar(branchId: string, userId: string) {
  await assertAccess(branchId, userId);
  return Cierre.find({ branch: branchId }).sort({ createdAt: -1 }).lean();
}

export async function crear(branchId: string, userId: string, dto: any) {
  await assertAccess(branchId, userId);
  return Cierre.create({
    branch:           branchId,
    responsable:      dto.responsable      || "",
    fechaApertura:    dto.fechaApertura    || "",
    fechaAperturaISO: dto.fechaAperturaISO || "",
    fechaCierre:      dto.fechaCierre      || new Date().toISOString(),
    baseCaja:         Number(dto.baseCaja) || 0,
    valor:            Number(dto.valor)    || 0,
    estado:           dto.estado           || "CUADRADA",
    snapshot:         dto.snapshot         || {},
  });
}
