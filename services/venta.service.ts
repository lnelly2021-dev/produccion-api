import Venta from "../models/Venta";
import Pedido from "../models/Pedido";
import Mesa from "../models/Mesa";
import Product from "../models/Product";
import Company from "../models/Company";
import { assertBranchAccess } from "../utils/tenant.guard";
import { logAudit } from "../utils/audit";
import { ForbiddenError, NotFoundError } from "../utils/errors";

export async function crear(branchId: string, userId: string, dto: any) {
  // assertBranchAccess devuelve branch — reutilizamos para evitar segunda query
  const { branch } = await assertBranchAccess(branchId, userId);

  // Validar mesaId si viene en el request
  if (dto.mesaId) {
    const mesa = await Mesa.findOne({ _id: dto.mesaId, branch: branchId });
    if (!mesa) throw new NotFoundError("Mesa no encontrada en esta sucursal");
  }

  const company = await Company.findById(branch.company).lean();
  const tipoImpuesto = company?.tributario?.tipoImpuesto ?? "NINGUNO";
  const taxRate =
    tipoImpuesto === "IVA_19" ? 0.19 :
    tipoImpuesto === "IPC_8"  ? 0.08 : 0;

  const subtotal   = Math.round((Number(dto.subtotal)  || 0) * 100) / 100;
  const descuento  = Math.round((Number(dto.descuento) || 0) * 100) / 100;
  const propina    = Math.round((Number(dto.propina)   || 0) * 100) / 100;
  const envio      = Math.round((Number(dto.envio)     || 0) * 100) / 100;
  const baseImp    = Math.max(subtotal - descuento, 0);
  const impuesto   = Math.round(baseImp * taxRate * 100) / 100;
  const valor      = baseImp + impuesto + propina + envio;

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
    subtotal,
    descuento,
    impuesto,
    propina,
    envio,
    valor,
    estado:     dto.tipoPago === "CRÉDITO" ? "PENDIENTE" : "CUADRADA",
    categoria:  "ingreso",
  });

  // Descontar stock — filtro { _id, branch } garantiza que el producto pertenece al branch
  for (const item of (dto.productos || [])) {
    await Product.findOneAndUpdate(
      { _id: item.productoId, branch: branchId },
      { $inc: { stock: -(Number(item.cantidad) || 0) } }
    );
  }

  if (dto.mesaId) {
    await Pedido.findOneAndUpdate(
      { mesa: dto.mesaId, branch: branchId, estado: "activo" },
      { estado: "facturado" }
    );
    await Mesa.findOneAndUpdate(
      { _id: dto.mesaId, branch: branchId },
      { estado: "libre", mesero: "" }
    );
  }

  logAudit({
    userId:       userId,
    companyId:    String(branch.company),
    branchId:     branchId,
    action:       "VENTA_CREADA",
    resourceType: "Venta",
    resourceId:   String(venta._id),
    meta:         { valor, tipoPago: dto.tipoPago || "CONTADO", nroFactura: dto.nroFactura },
  });

  return venta;
}

export async function listar(branchId: string, userId: string, desde?: string, hasta?: string) {
  await assertBranchAccess(branchId, userId);
  const filtro: any = { branch: branchId };
  if (desde || hasta) {
    filtro.createdAt = {};
    if (desde) filtro.createdAt.$gte = new Date(desde);
    if (hasta) filtro.createdAt.$lte = new Date(hasta);
  }
  return Venta.find(filtro).sort({ createdAt: -1 }).lean();
}

export async function anular(ventaId: string, branchId: string, userId: string, motivo: string) {
  const { branch } = await assertBranchAccess(branchId, userId);
  const venta = await Venta.findOneAndUpdate(
    { _id: ventaId, branch: branchId, estado: { $ne: "ANULADA" } },
    { estado: "ANULADA", motivoAnulacion: motivo, fechaAnulacion: new Date() },
    { new: true }
  );
  if (!venta) throw new NotFoundError("Venta no encontrada o ya anulada");

  // Devolver stock — filtro { _id, branch } garantiza que el producto pertenece al branch
  for (const item of venta.productos) {
    await Product.findOneAndUpdate(
      { _id: item.productoId, branch: branchId },
      { $inc: { stock: Number(item.cantidad) || 0 } }
    );
  }

  logAudit({
    userId:       userId,
    companyId:    String(branch.company),
    branchId:     branchId,
    action:       "VENTA_ANULADA",
    resourceType: "Venta",
    resourceId:   ventaId,
    meta:         { motivo },
  });

  return venta;
}
