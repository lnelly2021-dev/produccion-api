import Venta from "../models/Venta";
import Company from "../models/Company";
import { assertBranchAccess } from "../utils/tenant.guard";
import { NotFoundError } from "../utils/errors";

export async function reporteImpuestos(
  branchId: string,
  userId: string,
  desde: string,
  hasta: string
) {
  // assertBranchAccess devuelve branch — reutilizamos para evitar segunda query
  const { branch } = await assertBranchAccess(branchId, userId);

  const company = await Company.findById(branch.company).lean();
  const tipoImpuesto = company?.tributario?.tipoImpuesto ?? "NINGUNO";

  const fechaDesde = new Date(desde);
  const fechaHasta = new Date(hasta);
  fechaHasta.setHours(23, 59, 59, 999);

  const [totales] = await Venta.aggregate([
    {
      $match: {
        branch:     branch._id,
        estado:     { $ne: "ANULADA" },
        createdAt:  { $gte: fechaDesde, $lte: fechaHasta },
      },
    },
    {
      $group: {
        _id:           null,
        totalVentas:   { $sum: 1 },
        subtotal:      { $sum: "$subtotal" },
        descuentos:    { $sum: "$descuento" },
        baseImponible: { $sum: { $subtract: ["$subtotal", "$descuento"] } },
        impuesto:      { $sum: "$impuesto" },
        propinas:      { $sum: "$propina" },
        envios:        { $sum: "$envio" },
        totalFinal:    { $sum: "$valor" },
      },
    },
  ]);

  const porDia = await Venta.aggregate([
    {
      $match: {
        branch:    branch._id,
        estado:    { $ne: "ANULADA" },
        createdAt: { $gte: fechaDesde, $lte: fechaHasta },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "-05:00" },
        },
        ventas:        { $sum: 1 },
        subtotal:      { $sum: "$subtotal" },
        descuentos:    { $sum: "$descuento" },
        baseImponible: { $sum: { $subtract: ["$subtotal", "$descuento"] } },
        impuesto:      { $sum: "$impuesto" },
        totalFinal:    { $sum: "$valor" },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id:           0,
        fecha:         "$_id",
        ventas:        1,
        subtotal:      { $round: ["$subtotal",      2] },
        descuentos:    { $round: ["$descuentos",    2] },
        baseImponible: { $round: ["$baseImponible", 2] },
        impuesto:      { $round: ["$impuesto",      2] },
        totalFinal:    { $round: ["$totalFinal",    2] },
      },
    },
  ]);

  return {
    empresa:      company?.name ?? "",
    tipoImpuesto,
    desde,
    hasta,
    resumen: totales
      ? {
          totalVentas:   totales.totalVentas,
          subtotal:      round2(totales.subtotal),
          descuentos:    round2(totales.descuentos),
          baseImponible: round2(totales.baseImponible),
          impuesto:      round2(totales.impuesto),
          propinas:      round2(totales.propinas),
          envios:        round2(totales.envios),
          totalFinal:    round2(totales.totalFinal),
        }
      : null,
    porDia,
  };
}

function round2(n: number) {
  return Math.round((n || 0) * 100) / 100;
}
