/**
 * Corrige FRs generadas desde PF que tienen el anticipo completo en pagos.
 * Deja solo el saldo cobrado al entregar; el anticipo queda en la PF original.
 * Uso: npx ts-node scripts/fix-fr-from-pf.ts [--apply]
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const APPLY = process.argv.includes("--apply");

async function main() {
  await mongoose.connect(process.env.MONGO_URI!);
  console.log("✅ Conectado\n");
  const db = mongoose.connection.db!;

  // Buscar todas las PFs que ya tienen facturaRef
  const pfs = await db.collection("prefacturas").find({ estado: "ENTREGADA", facturaRef: { $exists: true } }).toArray();
  if (pfs.length === 0) { console.log("✅ Sin PFs entregadas."); await mongoose.disconnect(); return; }

  for (const pf of pfs) {
    const venta = await db.collection("ventas").findOne({ nroFactura: pf.facturaRef, branch: pf.branch });
    if (!venta) { console.log(`   ⚠️  ${pf.facturaRef}: venta no encontrada`); continue; }

    // Calcular saldo por medio: FR monto - anticipo PF monto para cada medio
    // Lo que sobra es el saldo cobrado al entregar (lo único que debe estar en la FR)
    const anticipoPorMedio: Record<string, number> = {};
    for (const p of (pf.pagos || [])) {
      anticipoPorMedio[p.medio] = (anticipoPorMedio[p.medio] || 0) + Number(p.monto);
    }

    const pagosNuevos: { medio: string; monto: number }[] = [];
    for (const p of (venta.pagos || [])) {
      const cubierto = anticipoPorMedio[p.medio] || 0;
      const monto    = Number(p.monto);
      if (monto > cubierto + 0.5) {
        pagosNuevos.push({ medio: p.medio, monto: Math.round(monto - cubierto) });
        anticipoPorMedio[p.medio] = 0;
      } else {
        anticipoPorMedio[p.medio] = Math.max(0, cubierto - monto);
      }
    }

    const totalAnticipo    = (pf.pagos || []).reduce((s: number, p: any) => s + Number(p.monto), 0);
    const totalPagosVenta  = (venta.pagos || []).reduce((s: number, p: any) => s + Number(p.monto), 0);
    const yaCorrecto       = Math.abs(totalPagosVenta - totalAnticipo) < 5 && totalPagosVenta <= totalAnticipo + 10;

    if (yaCorrecto) {
      console.log(`✅ ${pf.facturaRef}: pagos ya correctos ($${totalPagosVenta})`);
    } else {
      const mediosUnicos = [...new Set(pagosNuevos.map(p => p.medio))];
      const medioPago = pagosNuevos.length === 0 ? "ANTICIPO" : mediosUnicos.length > 1 ? "MIXTO" : mediosUnicos[0];

      console.log(`📄 ${pf.facturaRef} (ref ${pf.nroDocumento})`);
      console.log(`   Anticipo PF: $${totalAnticipo}  |  Total FR actual: $${totalPagosVenta}`);
      console.log(`   Antes:   ${JSON.stringify(venta.pagos)}`);
      console.log(`   Después: ${JSON.stringify(pagosNuevos)} (solo el saldo)`);

      if (APPLY) {
        await db.collection("ventas").updateOne(
          { _id: venta._id },
          { $set: { pagos: pagosNuevos, medioPago } }
        );
        console.log(`   ✅ Actualizada`);
      }
    }
  }

  if (!APPLY) console.log("\n🔍 DRY RUN — ejecuta con --apply para aplicar.");
  else console.log("\n✅ Corrección completada.");
  await mongoose.disconnect();
}

main().catch(err => { console.error("❌", err.message); process.exit(1); });
