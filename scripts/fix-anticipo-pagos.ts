/**
 * Corrige ventas generadas desde PF que tienen {medio: "ANTICIPO"}.
 * Las reemplaza con los medios de pago reales del PF de origen.
 * Uso: npx ts-node scripts/fix-anticipo-pagos.ts [--apply]
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const APPLY = process.argv.includes("--apply");

async function main() {
  await mongoose.connect(process.env.MONGO_URI!);
  console.log("✅ Conectado\n");
  const db = mongoose.connection.db!;

  // Ventas con algún pago de medio "ANTICIPO"
  const ventas = await db.collection("ventas").find({
    "pagos.medio": "ANTICIPO"
  }).toArray();

  if (ventas.length === 0) { console.log("✅ No hay ventas con medio ANTICIPO."); await mongoose.disconnect(); return; }

  console.log(`⚠️  ${ventas.length} venta(s) con medio ANTICIPO:\n`);

  for (const venta of ventas) {
    // Buscar la pre-factura de origen por nroFactura
    const pf = await db.collection("prefacturas").findOne({ facturaRef: venta.nroFactura, branch: venta.branch });
    if (!pf) { console.log(`   ⚠️  ${venta.nroFactura}: no se encontró PF de origen — omitida`); continue; }

    // Estrategia: reemplazar entradas ANTICIPO por los pagos reales del PF,
    // manteniendo el resto de pagos de la venta (ej: saldo cobrado al entregar)
    const pagosReales = [
      // Pagos reales del anticipo (sustituyen la entrada "ANTICIPO")
      ...(pf.pagos  || []).map((p: any) => ({ medio: p.medio, monto: p.monto })),
      // Pagos de la venta que NO son "ANTICIPO" (saldo cobrado al entregar, etc.)
      ...(venta.pagos || []).filter((p: any) => p.medio !== "ANTICIPO"),
    ].filter((p: any) => p.monto > 0);

    const mediosUnicos = [...new Set(pagosReales.map((p: any) => p.medio))];
    const medioPago = mediosUnicos.length > 1 ? "MIXTO" : mediosUnicos[0] || "EFECTIVO";

    console.log(`   📄 ${venta.nroFactura} (ref PF: ${pf.nroDocumento})`);
    console.log(`      Antes: ${JSON.stringify(venta.pagos)}`);
    console.log(`      Después: ${JSON.stringify(pagosReales)}`);

    if (APPLY) {
      await db.collection("ventas").updateOne(
        { _id: venta._id },
        { $set: { pagos: pagosReales, medioPago } }
      );
      console.log(`      ✅ Actualizada`);
    }
  }

  if (!APPLY) {
    console.log("\n🔍 DRY RUN — ejecuta con --apply para aplicar.");
  } else {
    console.log("\n✅ Corrección completada.");
  }
  await mongoose.disconnect();
}

main().catch(err => { console.error("❌", err.message); process.exit(1); });
