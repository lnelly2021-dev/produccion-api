import Pedido from "../models/Pedido";
import Mesa from "../models/Mesa";
import { assertBranchAccess } from "../utils/tenant.guard";
import { emitToBranch } from "../sockets/socket.server";
import { NotFoundError } from "../utils/errors";

export async function getActivo(mesaId: string, branchId: string, userId: string) {
  await assertBranchAccess(branchId, userId);
  return Pedido.findOne({ mesa: mesaId, branch: branchId, estado: "activo" }).lean();
}

export async function guardar(mesaId: string, branchId: string, userId: string, items: any[]) {
  await assertBranchAccess(branchId, userId);

  // Validar que la mesa pertenece al branch antes del upsert
  const mesa = await Mesa.findOne({ _id: mesaId, branch: branchId, active: true });
  if (!mesa) throw new NotFoundError("Mesa no encontrada en esta sucursal");

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

  if (itemsNorm.length > 0) {
    await Mesa.findOneAndUpdate(
      { _id: mesaId, branch: branchId },
      { estado: "ocupada" }
    );
  }

  // Notificar al terminal del mostrador en tiempo real
  emitToBranch(branchId, "pedido_nuevo", {
    mesaId,
    branchId,
    mesaNombre: mesa.nombre,
    mesero:     mesa.mesero,
    items:      itemsNorm,
    total:      itemsNorm.reduce((a, i) => a + (i.subtotal || 0), 0),
    timestamp:  new Date().toISOString(),
  });

  return pedido;
}

export async function cancelar(mesaId: string, branchId: string, userId: string) {
  await assertBranchAccess(branchId, userId);
  await Pedido.findOneAndUpdate(
    { mesa: mesaId, branch: branchId, estado: "activo" },
    { estado: "cancelado" }
  );
}
