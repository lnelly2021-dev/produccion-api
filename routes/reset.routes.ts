import { Router, Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { authMiddleware } from "../middlewares/auth.middleware";
import { assertBranchRole } from "../utils/tenant.guard";
import Branch   from "../models/Branch";
import Product  from "../models/Product";
import Mesa     from "../models/Mesa";
import Venta    from "../models/Venta";
import Pedido   from "../models/Pedido";
import Cierre   from "../models/Cierre";
import Domicilio from "../models/Domicilio";
import Recaudo  from "../models/Recaudo";
import Pasivo   from "../models/Pasivo";
import AuditLog from "../models/AuditLog";
import { ok }   from "../utils/response.util";

// Modelos inline registrados en otros archivos — accedemos por nombre
const Egreso     = () => mongoose.models["Egreso"]     as mongoose.Model<any>;
const Salida     = () => mongoose.models["Salida"]     as mongoose.Model<any>;
const Cotizacion = () => mongoose.models["Cotizacion"] as mongoose.Model<any>;

const router = Router({ mergeParams: true });
router.use(authMiddleware);

/**
 * POST /branches/:branchId/reset-operacional
 *
 * Limpia SOLO los datos operacionales de la sucursal:
 *   - Borra: Ventas, Egresos, Pedidos, Domicilios, Cierres, Recaudos,
 *            Pasivos, Cotizaciones, Salidas, AuditLogs
 *   - Resetea: stock y stockCombo de productos, estado/mesero de mesas,
 *              consecutivo de la sucursal
 *
 * CONSERVA: Productos (nombre, receta, foto, precios, stockInicial),
 *           Contactos, Company, Branch config, Users, Accesos
 *
 * Solo admins de la empresa pueden ejecutarlo.
 */
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branchId = String(req.params.branchId);
    const userId   = req.user!.userId;

    // Solo admins pueden hacer el reset operacional
    await assertBranchRole(branchId, userId, ["admin"]);

    const bId = new mongoose.Types.ObjectId(branchId);

    // ── 1. Borrar datos operacionales ───────────────────────────────────────
    await Promise.all([
      Venta.deleteMany({ branch: bId }),
      Pedido.deleteMany({ branch: bId }),
      Domicilio.deleteMany({ branch: bId }),
      Cierre.deleteMany({ branch: bId }),
      Recaudo.deleteMany({ branch: bId }),
      Pasivo.deleteMany({ branch: bId }),
      AuditLog.deleteMany({ branchId: bId }),
      // Modelos inline (registrados al cargar sus rutas)
      Egreso()?.deleteMany({ branch: bId }),
      Salida()?.deleteMany({ branch: bId }),
      Cotizacion()?.deleteMany({ branch: bId }),
    ]);

    // ── 2. Liberar todas las mesas (no las elimina, solo las deja libres) ───
    await Mesa.updateMany(
      { branch: bId },
      { $set: { estado: "libre", mesero: "" } }
    );

    // ── 3. Poner stock y stockInicial a 0, limpiar stockCombo ──────────────
    await Product.updateMany(
      { branch: bId },
      { $set: { stock: 0, stockInicial: 0, stockCombo: 0 } }
    );

    // ── 4. Resetear consecutivo de facturación ──────────────────────────────
    await Branch.findByIdAndUpdate(branchId, { $set: { consecutivo: 0 } });

    ok(res, {
      message: "Reset operacional completado",
      detalle: "Ventas, egresos, pedidos, domicilios, cierres, recaudos, pasivos, cotizaciones y salidas eliminados. Productos, contactos y configuración intactos.",
    });
  } catch (err) {
    next(err);
  }
});

export default router;
