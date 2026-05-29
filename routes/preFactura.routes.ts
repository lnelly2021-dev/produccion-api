import { Router, Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { authMiddleware } from "../middlewares/auth.middleware";
import { assertBranchAccess } from "../utils/tenant.guard";
import { ok, created } from "../utils/response.util";
import { NotFoundError, ValidationError } from "../utils/errors";
import PreFactura from "../models/PreFactura";
import Branch from "../models/Branch";
import Product from "../models/Product";
import Venta from "../models/Venta";

const router = Router({ mergeParams: true });
router.use(authMiddleware);

// ── GET ───────────────────────────────────────────────────────────────────────
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branchId = String(req.params.branchId);
    await assertBranchAccess(branchId, req.user!.userId);
    const filtro: any = { branch: branchId };
    if (req.query.estado) filtro.estado = req.query.estado;
    const lista = await PreFactura.find(filtro).sort({ createdAt: -1 }).lean();
    ok(res, lista);
  } catch (err) { next(err); }
});

// ── POST (crear) ──────────────────────────────────────────────────────────────
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branchId = String(req.params.branchId);
    await assertBranchAccess(branchId, req.user!.userId);

    const branch = await Branch.findByIdAndUpdate(
      branchId,
      { $inc: { consecutivoPF: 1 } },
      { new: true }
    );
    if (!branch) throw new NotFoundError("Sucursal no encontrada");

    const subtotal  = Math.round(Number(req.body.subtotal)  || 0);
    const descuento = Math.round(Number(req.body.descuento) || 0);
    const impuesto  = Math.round(Number(req.body.impuesto)  || 0);
    const propina   = Math.round(Number(req.body.propina)   || 0);
    const envio     = Math.round(Number(req.body.envio)     || 0);
    // Total definitivo = (subtotal - descuento) + envio  (sin impuesto en PF)
    const total     = Math.max(0, subtotal - descuento) + envio;
    const pagos     = (req.body.pagos || []) as { medio: string; monto: number }[];
    const anticipo  = Math.round(pagos.reduce((s, p) => s + (Number(p.monto) || 0), 0));

    const pf = await PreFactura.create({
      branch:         branchId,
      nroDocumento:   `PF-${branch.consecutivoPF}`,
      tercero:        req.body.tercero   || "CONSUMIDOR FINAL",
      productos:      req.body.productos || [],
      subtotal, descuento, impuesto, propina, envio, total,
      pagos,
      anticipo,
      abonos: [],
      saldoPendiente: Math.max(total - anticipo, 0),
    });

    created(res, pf);
  } catch (err) { next(err); }
});

// ── POST /:pfId/abonar — registra pago parcial sin entregar ───────────────────
router.post("/:pfId/abonar", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branchId = String(req.params.branchId);
    await assertBranchAccess(branchId, req.user!.userId);

    const pf = await PreFactura.findOne({ _id: req.params.pfId, branch: branchId });
    if (!pf) throw new NotFoundError("Pre-factura no encontrada");
    if (pf.estado !== "PENDIENTE") throw new ValidationError("Solo se pueden abonar pre-facturas pendientes");

    const pagosAbono = (req.body.pagos || []) as { medio: string; monto: number }[];
    const montoAbono = Math.round(pagosAbono.reduce((s, p) => s + (Number(p.monto) || 0), 0));
    if (montoAbono <= 0) throw new ValidationError("El monto del abono debe ser mayor a cero");
    if (montoAbono > pf.saldoPendiente) throw new ValidationError(`El abono $${montoAbono} supera el saldo $${pf.saldoPendiente}`);

    // Registrar cada pago como abono
    for (const p of pagosAbono) {
      if ((Number(p.monto) || 0) > 0)
        pf.abonos.push({ fecha: new Date(), medio: p.medio, monto: Number(p.monto) });
    }
    pf.saldoPendiente = Math.max(pf.saldoPendiente - montoAbono, 0);
    await pf.save();

    ok(res, pf);
  } catch (err) { next(err); }
});

// ── POST /:pfId/entregar — convierte a FR, mueve inventario ───────────────────
router.post("/:pfId/entregar", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branchId = String(req.params.branchId);
    await assertBranchAccess(branchId, req.user!.userId);

    const pf = await PreFactura.findOne({ _id: req.params.pfId, branch: branchId });
    if (!pf) throw new NotFoundError("Pre-factura no encontrada");
    if (pf.estado !== "PENDIENTE") throw new ValidationError("Esta pre-factura ya fue entregada o anulada");

    // Pagos adicionales del saldo
    const pagosSaldo = (req.body.pagos || []) as { medio: string; monto: number }[];
    const montoSaldo = Math.round(pagosSaldo.reduce((s, p) => s + (Number(p.monto) || 0), 0));

    if (pf.saldoPendiente > 0 && montoSaldo < pf.saldoPendiente)
      throw new ValidationError(`Saldo pendiente $${pf.saldoPendiente} no cubierto`);

    const branch = await Branch.findByIdAndUpdate(
      branchId, { $inc: { consecutivo: 1 } }, { new: true }
    );
    if (!branch) throw new NotFoundError("Sucursal no encontrada");
    const nroFactura = `FR-${branch.consecutivo}`;

    // FR solo lleva el saldo cobrado HOY al entregar.
    // El anticipo quedó registrado en la PF el día que se recibió → no se repite aquí.
    const pagosFactura = pagosSaldo.filter((p: any) => (Number(p.monto) || 0) > 0);
    const mediosUnicos = pagosFactura.length > 0
      ? [...new Set(pagosFactura.map((p: any) => p.medio))]
      : ["ANTICIPO"];
    const medioPago = mediosUnicos.length > 1 ? "MIXTO" : mediosUnicos[0];

    // Crear la venta (factura real)
    const venta = await Venta.create({
      branch:    branchId,
      nroFactura,
      cliente:   pf.tercero,
      tipoPago:  "CONTADO",
      medioPago,
      pagos:     pagosFactura,
      productos: pf.productos,
      subtotal:  pf.subtotal,
      descuento: pf.descuento,
      impuesto:  pf.impuesto,
      propina:   pf.propina,
      envio:     pf.envio,
      valor:     pf.total,
      estado:    "CUADRADA",
      categoria: "ingreso",
    });

    // 4. Descontar inventario
    for (const item of pf.productos) {
      if (!item.productoId) continue;
      const prod = await Product.findOne({ _id: item.productoId, branch: branchId }).lean();
      if (!prod) continue;
      if (prod.componentes && (prod.componentes as any[]).length > 0) {
        for (const comp of prod.componentes as any[]) {
          await Product.findByIdAndUpdate(comp.productoId, { $inc: { stock: -comp.cantidad * item.cantidad, stockCombo: comp.cantidad * item.cantidad } });
        }
      } else {
        await Product.findByIdAndUpdate(item.productoId, { $inc: { stock: -item.cantidad } });
      }
    }

    // Marcar PF como entregada (abonos intermedios ya están; NO agregar saldo aquí — quedó en FR)
    pf.estado         = "ENTREGADA";
    pf.facturaRef     = nroFactura;
    pf.saldoPendiente = 0;
    await pf.save();

    ok(res, { venta, preFactura: pf });
  } catch (err) { next(err); }
});

// ── POST /:pfId/anular ────────────────────────────────────────────────────────
router.post("/:pfId/anular", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branchId = String(req.params.branchId);
    await assertBranchAccess(branchId, req.user!.userId);
    const pf = await PreFactura.findOne({ _id: req.params.pfId, branch: branchId });
    if (!pf) throw new NotFoundError("Pre-factura no encontrada");
    if (pf.estado !== "PENDIENTE") throw new ValidationError("Solo se pueden anular pre-facturas pendientes");
    pf.estado = "ANULADA";
    await pf.save();
    ok(res, pf);
  } catch (err) { next(err); }
});

export default router;
