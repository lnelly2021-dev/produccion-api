import Pedido from "../models/Pedido";
import Mesa from "../models/Mesa";
import UserCompanyAccess from "../models/UserCompanyAccess";
import { NotFoundError, ForbiddenError } from "../utils/errors";

async function assertAccess(branchId: string, userId: string) {
  const access = await UserCompanyAccess.findOne({ user: userId, branches: branchId, active: true });
  if (!access) throw new ForbiddenError("Access denied");
}

export async function getActivo(mesaId: string, branchId: string, userId: string) {
  await assertAccess(branchId, userId);
  return Pedido.findOne({ mesa: mesaId, branch: branchId, estado: "activo" }).lean();
}

export async function guardar(mesaId: string, branchId: string, userId: string, items: any[]) {
  await assertAccess(branchId, userId);

  const itemsNorm = items.map(i => ({
    productoId: String(i.productoId || i.id || ""),
    nombre:     String(i.nombre || ""),
    cantidad:   Number(i.cantidad) || 0,
    precio:     Number(i.precio || i.precioPublico) || 0,
    subtotal:   Number(i.subtotal || (i.precio * i.cantidad)) || 0,
    notas:      i.notas || "",
  }));

  const pedido = await Pedido.findOneAndUpdate(
    { mesa: mesaId, branch: branchId, estado: "activo" },
    { items: itemsNorm, mesa: mesaId, branch: branchId },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Marcar mesa como ocupada si tiene items
  if (itemsNorm.length > 0) {
    await Mesa.findByIdAndUpdate(mesaId, { estado: "ocupada" });
  }

  return pedido;
}

export async function cancelar(mesaId: string, branchId: string, userId: string) {
  await assertAccess(branchId, userId);
  await Pedido.findOneAndUpdate(
    { mesa: mesaId, branch: branchId, estado: "activo" },
    { estado: "cancelado" }
  );
}
