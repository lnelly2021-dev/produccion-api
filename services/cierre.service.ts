import Cierre from "../models/Cierre";
import { assertBranchAccess } from "../utils/tenant.guard";

export async function listar(branchId: string, userId: string) {
  await assertBranchAccess(branchId, userId);
  return Cierre.find({ branch: branchId }).sort({ createdAt: -1 }).lean();
}

export async function crear(branchId: string, userId: string, dto: any) {
  await assertBranchAccess(branchId, userId);
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
