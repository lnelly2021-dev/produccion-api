/**
 * Script puntual: resetea stock negativo a 0 en productos de una empresa.
 * Uso: npx ts-node scripts/fix-negative-stock.ts [--apply]
 *   sin --apply  → solo muestra los productos afectados (dry run)
 *   con --apply  → aplica el fix
 */

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI!;
const APPLY = process.argv.includes("--apply");

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log("✅ Conectado a MongoDB\n");

  const db = mongoose.connection.db!;

  // 1. Buscar solo productos de DELICIAS DE ANYELI con stock negativo
  const negativos = await db.collection("products").aggregate([
    { $match: { stock: { $lt: 0 } } },
    { $lookup: { from: "branches", localField: "branch", foreignField: "_id", as: "branchInfo" } },
    { $unwind: "$branchInfo" },
    { $lookup: { from: "companies", localField: "branchInfo.company", foreignField: "_id", as: "companyInfo" } },
    { $unwind: "$companyInfo" },
    { $project: { nombre: 1, stock: 1, branchNombre: "$branchInfo.name", companyNombre: "$companyInfo.name" } },
    { $match: { companyNombre: /delicias/i } },
  ]).toArray();

  if (negativos.length === 0) {
    console.log("✅ No hay productos con stock negativo.");
    await mongoose.disconnect();
    return;
  }

  // Agrupar por empresa para mostrar resumen
  const porEmpresa: Record<string, typeof negativos> = {};
  for (const p of negativos) {
    const key = `${p.companyNombre} / ${p.branchNombre}`;
    if (!porEmpresa[key]) porEmpresa[key] = [];
    porEmpresa[key].push(p);
  }

  console.log(`⚠️  Productos con stock negativo (${negativos.length} total):\n`);
  for (const [empresa, productos] of Object.entries(porEmpresa)) {
    console.log(`  📦 ${empresa}`);
    for (const p of productos) {
      console.log(`     - ${p.nombre}: stock = ${p.stock}`);
    }
  }

  if (!APPLY) {
    console.log(`\n🔍 DRY RUN — no se modificó nada.`);
    console.log(`   Para aplicar el fix ejecuta: npx ts-node scripts/fix-negative-stock.ts --apply`);
    await mongoose.disconnect();
    return;
  }

  // Aplicar el fix
  const ids = negativos.map(p => p._id);
  const result = await db.collection("products").updateMany(
    { _id: { $in: ids } },
    { $set: { stock: 0 } }
  );

  console.log(`\n✅ Fix aplicado: ${result.modifiedCount} productos actualizados a stock = 0.`);
  await mongoose.disconnect();
}

main().catch(err => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
