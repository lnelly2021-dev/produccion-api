import { Types } from "mongoose";
import Ingrediente from "../models/Ingrediente";
import Receta from "../models/Receta";
import CostoProduccion from "../models/CostoProduccion";

const UNIDADES_GRAMO   = ["kg", "kl", "kilo", "kilos", "gr", "g"];
const UNIDADES_LIQUIDO = ["lt", "l", "litro", "ml"];

const totalPersonal = (lista: any[]) => (lista || []).reduce((s: number, e: any) => s + e.salario * (1 + e.prestaciones / 100), 0);

function calcTarifas(cp: any) {
  const baseMensual = cp?.baseMensual || 0;
  // Si los nuevos arrays desglosados están vacíos (documentos creados antes de la migración),
  // se cae al valor escalar legacy ventasMensual/admonMensual para no romper los porcentajes.
  const sumaVentas = totalPersonal(cp?.personalVentas) + (cp?.gastosVentas || []).reduce((s: number, g: any) => s + g.valorMes, 0);
  const sumaAdmon  = totalPersonal(cp?.personalAdmon)  + (cp?.gastosAdmon  || []).reduce((s: number, g: any) => s + g.valorMes, 0);
  const totalVentas = sumaVentas || (cp?.ventasMensual || 0);
  const totalAdmon  = sumaAdmon  || (cp?.admonMensual  || 0);
  const pctVentas = baseMensual > 0 ? (totalVentas / baseMensual) * 100 : 0;
  const pctAdmon  = baseMensual > 0 ? (totalAdmon  / baseMensual) * 100 : 0;
  const minMes = (cp?.diasLaborales || 0) * (cp?.horasDia || 0) * 60;
  if (!minMes) return { moMin: 0, cifMin: 0, pctVentas, pctAdmon };
  const totalMO  = (cp?.empleados || []).reduce((s: number, e: any) => s + e.salario * (1 + e.prestaciones / 100), 0);
  const totalCIF = (cp?.cif || []).reduce((s: number, c: any) => s + c.valorMes, 0);
  return { moMin: totalMO / minMes, cifMin: totalCIF / minMes, pctVentas, pctAdmon };
}

function costoUnitarioIngrediente(ing: { unidad: string; costoUnitario: number; costoGr: number }) {
  const unidad = (ing.unidad || "").toLowerCase();
  const esGramo   = UNIDADES_GRAMO.includes(unidad);
  const esLiquido = UNIDADES_LIQUIDO.includes(unidad);
  return (esGramo || esLiquido) ? (ing.costoGr > 0 ? ing.costoGr : ing.costoUnitario / 1000) : ing.costoUnitario;
}

/**
 * Recalcula en cascada el costo de todas las recetas afectadas por un cambio
 * en el costo de uno o más ingredientes y/o recetas (usadas como sub-receta
 * de otras), propagando el efecto a través de los niveles hasta llegar a los
 * productos terminados. `idsAfectados` puede mezclar _id de Ingrediente y de Receta.
 */
export async function recalcularCadena(branchId: string, idsAfectados: string[] = []) {
  const [cfg, ingredientes, recetas] = await Promise.all([
    CostoProduccion.findOne({ branch: branchId }).lean(),
    Ingrediente.find({ branch: branchId }).lean(),
    Receta.find({ branch: branchId, activo: true }),
  ]);

  const tarifas = calcTarifas(cfg);
  const ingMap = new Map(ingredientes.map(i => [String(i._id), i]));
  const recMap = new Map(recetas.map(r => [String(r._id), r]));

  let pendientes = new Set(idsAfectados.map(String));
  let pasada = 0;

  while (pendientes.size > 0 && pasada < recetas.length + 1) {
    pasada++;
    const siguientePendientes = new Set<string>();

    for (const receta of recetas) {
      const dependeDeAfectado = receta.lineas.some(l =>
        (l.tipo === "ingrediente" && l.ingredienteId && pendientes.has(String(l.ingredienteId))) ||
        (l.tipo === "subreceta"   && l.recetaId      && pendientes.has(String(l.recetaId)))
      );
      if (!dependeDeAfectado) continue;

      let costoMP = 0;
      for (const linea of receta.lineas) {
        let cu = linea.costoUnitario;
        if (linea.tipo === "ingrediente" && linea.ingredienteId) {
          const ing = ingMap.get(String(linea.ingredienteId));
          if (ing) cu = costoUnitarioIngrediente(ing);
        } else if (linea.tipo === "subreceta" && linea.recetaId) {
          const sub = recMap.get(String(linea.recetaId));
          if (sub) cu = sub.rendimiento > 0 ? sub.costoTotal / sub.rendimiento : 0;
        }
        linea.costoUnitario = cu;
        linea.costoLinea = linea.cantidad * cu;
        costoMP += linea.costoLinea;
      }

      const costoMO = receta.moExterna ? receta.rendimiento * receta.moExternaPorUnidad : receta.minutosMO * tarifas.moMin;
      const costoCIF = receta.moExterna ? 0 : receta.minutosCIF * tarifas.cifMin;
      const costoTotal = costoMP + costoMO + costoCIF;
      const costoPorcion = receta.rendimiento > 0 ? costoTotal / receta.rendimiento : 0;

      const pctVentasEf = receta.pctPersonalizado ? receta.pctVentas : tarifas.pctVentas;
      const pctAdmonEf  = receta.pctPersonalizado ? receta.pctAdmon  : tarifas.pctAdmon;
      const costoVentas = receta.esProductoTerminado ? costoTotal * (pctVentasEf / 100) : 0;
      const costoAdmon  = receta.esProductoTerminado ? costoTotal * (pctAdmonEf  / 100) : 0;

      receta.costoMP = costoMP;
      receta.costoMO = costoMO;
      receta.costoCIF = costoCIF;
      receta.costoTotal = costoTotal;
      receta.costoPorcion = costoPorcion;
      receta.pctVentas = pctVentasEf;
      receta.pctAdmon = pctAdmonEf;
      receta.costoVentas = costoVentas;
      receta.costoAdmon = costoAdmon;
      receta.costoTotalFinal = costoTotal + costoAdmon + costoVentas;

      await receta.save();
      siguientePendientes.add(String(receta._id));
    }

    pendientes = siguientePendientes;
  }
}

/**
 * Recalcula TODAS las recetas de la sucursal. Se usa cuando cambia la
 * configuración global de Costos de Producción (tarifas $/min de MO y CIF,
 * o los % de Ventas/Admón derivados de gastosVentas/gastosAdmon/baseMensual):
 * ese cambio afecta a cualquier receta, no solo a las que dependen de un
 * ingrediente o sub-receta puntual, así que `recalcularCadena` por sí sola
 * no las detectaría como "afectadas".
 */
export async function recalcularTodo(branchId: string) {
  const [ingredientes, recetas] = await Promise.all([
    Ingrediente.find({ branch: branchId }, "_id").lean(),
    Receta.find({ branch: branchId, activo: true }, "_id").lean(),
  ]);
  const ids = [...ingredientes.map(i => String(i._id)), ...recetas.map(r => String(r._id))];
  await recalcularCadena(branchId, ids);
}
