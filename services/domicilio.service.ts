import Domicilio from "../models/Domicilio";
import Venta from "../models/Venta";
import Product from "../models/Product";
import { assertBranchAccess } from "../utils/tenant.guard";
import { ForbiddenError, NotFoundError } from "../utils/errors";

const SIGUIENTE: Record<string, string | null> = {
  NUEVO: "EN_PREPARACION", EN_PREPARACION: "EN_CAMINO",
  EN_CAMINO: "ENTREGADO",  ENTREGADO: null, CANCELADO: null,
};

export async function listar(branchId: string, userId: string) {
  await assertBranchAccess(branchId, userId);
  return Domicilio.find({ branch: branchId }).sort({ createdAt: -1 }).lean();
}

export async function crear(branchId: string, userId: string, dto: any) {
  await assertBranchAccess(branchId, userId);

  const count = await Domicilio.countDocuments({ branch: branchId });
  const nro   = `DOM-${String(count + 1).padStart(3, "0")}`;

  const dom = await Domicilio.create({
    branch:       branchId,
    nro,
    cliente:      dto.cliente,
    telefono:     dto.telefono     || "",
    direccion:    dto.direccion,
    barrio:       dto.barrio       || "",
    productos:    dto.productos    || [],
    subtotal:     Number(dto.subtotal) || 0,
    envio:        Number(dto.envio)    || 0,
    total:        Number(dto.total),
    medioPago:    dto.medioPago    || "EFECTIVO",
    pagos:        dto.pagos        || [],
    notas:        dto.notas        || "",
    domiciliario: dto.domiciliario || "",
    facturaId:    dto.facturaId,
  });

  if (dto.facturaId) {
    await Venta.create({
      branch:     branchId,
      nroFactura: dto.facturaId,
      cliente:    dto.cliente,
      tipoPago:   "CONTADO",
      medioPago:  dto.medioPago || "EFECTIVO",
      pagos:      dto.pagos || [],
      productos:  (dto.productos || []).map((p: any) => ({
        productoId: String(p.id || p.productoId || ""),
        nombre:     p.nombre,
        cantidad:   p.cantidad,
        precio:     p.precio,
        subtotal:   p.precio * p.cantidad,
      })),
      subtotal:  Number(dto.subtotal) || 0,
      impuesto:  Number(dto.impuesto) || 0,
      propina:   0,
      envio:     Number(dto.envio)    || 0,
      valor:     Number(dto.total),
      estado:    "CUADRADA",
      categoria: "ingreso",
    });

    // Filtro { _id, branch } garantiza que el producto pertenece al branch
    for (const p of (dto.productos || [])) {
      await Product.findOneAndUpdate(
        { _id: String(p.id || p.productoId || ""), branch: branchId },
        { $inc: { stock: -(Number(p.cantidad) || 0) } }
      );
    }
  }

  return dom;
}

export async function avanzarEstado(domId: string, branchId: string, userId: string) {
  await assertBranchAccess(branchId, userId);
  const dom = await Domicilio.findOne({ _id: domId, branch: branchId });
  if (!dom) throw new NotFoundError("Domicilio no encontrado");

  const sig = SIGUIENTE[dom.estado];
  if (!sig) throw new Error("No hay siguiente estado");

  dom.estado = sig as any;
  await dom.save();

  if (sig === "ENTREGADO" && !dom.facturaId) {
    const existeVenta = await Venta.findOne({ nroFactura: dom.nro, branch: branchId });
    if (!existeVenta) {
      await Venta.create({
        branch:     branchId,
        nroFactura: dom.nro,
        cliente:    dom.cliente,
        tipoPago:   "CONTADO",
        medioPago:  dom.medioPago,
        pagos:      dom.pagos,
        productos:  dom.productos.map(p => ({ ...p, subtotal: p.precio * p.cantidad })),
        subtotal:   dom.subtotal || 0,
        impuesto:   0,
        propina:    0,
        envio:      dom.envio    || 0,
        valor:      dom.total,
        estado:     "CUADRADA",
        categoria:  "ingreso",
      });
      // Filtro { _id, branch } garantiza que el producto pertenece al branch
      for (const p of dom.productos) {
        const pid = String(p.productoId || "").trim();
        if (!pid || pid.length < 12) continue;
        try {
          await Product.findOneAndUpdate(
            { _id: pid, branch: branchId },
            { $inc: { stock: -(Number(p.cantidad) || 0) } }
          );
        } catch { /* ignore invalid productoId */ }
      }
    }
  }

  return dom;
}

export async function cancelar(domId: string, branchId: string, userId: string) {
  await assertBranchAccess(branchId, userId);
  const dom = await Domicilio.findOneAndUpdate(
    { _id: domId, branch: branchId },
    { estado: "CANCELADO" },
    { new: true }
  );
  if (!dom) throw new NotFoundError("Domicilio no encontrado");
  return dom;
}
