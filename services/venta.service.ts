import Venta from "../models/Venta";
import Pedido from "../models/Pedido";
import Mesa from "../models/Mesa";
import Product from "../models/Product";
import UserCompanyAccess from "../models/UserCompanyAccess";
import { ForbiddenError } from "../utils/errors";

async function assertAccess(branchId: string, userId: string) {
  const access = await UserCompanyAccess.findOne({ user: userId, branches: branchId, active: true });
  if (!access) throw new ForbiddenError("Access denied");
}

export async function crear(branchId: string, userId: string, dto: any) {
  await assertAccess(branchId, userId);

  const venta = await Venta.create({
    branch:     branchId,
    nroFactura: dto.nroFactura,
    mesa:       dto.mesaId     || undefined,
    mesero:     dto.mesero     || "",
    cliente:    dto.cliente    || "CONSUMIDOR FINAL",
    tipoPago:   dto.tipoPago   || "CONTADO",
    medioPago:  dto.medioPago  || "EFECTIVO",
    pagos:      dto.pagos      || [],
    productos:  dto.productos  || [],
    subtotal:   Number(dto.subtotal) || 0,
    impuesto:   Number(dto.impuesto) || 0,
    propina:    Number(dto.propina)  || 0,
    envio:      Number(dto.envio)    || 0,
    valor:      Number(dto.valor)    || 0,
    estado:     dto.tipoPago === "CRÉDITO" ? "PENDIENTE" : "CUADRADA",
    categoria:  "ingreso",
  });

  // Descontar stock de cada producto
  for (const item of (dto.productos || [])) {
    await Product.findOneAndUpdate(
      { _id: item.productoId, branch: branchId },
      { $inc: { stock: -(Number(item.cantidad) || 0) } }
    );
  }

  // Marcar pedido como facturado y liberar mesa
  if (dto.mesaId) {
    await Pedido.findOneAndUpdate(
      { mesa: dto.mesaId, branch: branchId, estado: "activo" },
      { estado: "facturado" }
    );
    await Mesa.findByIdAndUpdate(dto.mesaId, { estado: "libre", mesero: "" });
  }

  return venta;
}

export async function listar(branchId: string, userId: string, desde?: string, hasta?: string) {
  await assertAccess(branchId, userId);
  const filtro: any = { branch: branchId };
  if (desde || hasta) {
    filtro.createdAt = {};
    if (desde) filtro.createdAt.$gte = new Date(desde);
    if (hasta) filtro.createdAt.$lte = new Date(hasta);
  }
  return Venta.find(filtro).sort({ createdAt: -1 }).lean();
}

export async function anular(ventaId: string, branchId: string, userId: string, motivo: string) {
  await assertAccess(branchId, userId);
  const venta = await Venta.findOneAndUpdate(
    { _id: ventaId, branch: branchId, estado: { $ne: "ANULADA" } },
    { estado: "ANULADA", motivoAnulacion: motivo, fechaAnulacion: new Date() },
    { new: true }
  );
  if (!venta) throw new Error("Venta no encontrada o ya anulada");

  // Devolver stock
  for (const item of venta.productos) {
    await Product.findOneAndUpdate(
      { _id: item.productoId, branch: branchId },
      { $inc: { stock: Number(item.cantidad) || 0 } }
    );
  }
  return venta;
}
