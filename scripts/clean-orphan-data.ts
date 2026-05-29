/**
 * Script: elimina todos los datos huérfanos de empresas/sucursales eliminadas.
 * Uso: npx ts-node scripts/clean-orphan-data.ts [--apply]
 */

import mongoose, { Types } from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const APPLY = process.argv.includes("--apply");

// Colecciones con campo "branch" (ObjectId)
const BRANCH_COLLECTIONS = [
  "products", "ventas", "egresos", "recaudos", "pasivos",
  "cotizaciones", "cierres", "mesas", "pedidos", "domicilios", "contactos",
];

async function main() {
  await mongoose.connect(process.env.MONGO_URI!);
  console.log("✅ Conectado a MongoDB\n");
  const db = mongoose.connection.db!;

  // 1. IDs de empresas activas
  const companies = await db.collection("companies").find({}, { projection: { _id: 1, name: 1 } }).toArray();
  const validCompanyIds = new Set(companies.map(c => c._id.toString()));
  console.log(`📋 Empresas activas: ${companies.map(c => c.name).join(", ")}\n`);

  // 2. Sucursales: separar las válidas de las huérfanas
  const allBranches = await db.collection("branches").find({}, { projection: { _id: 1, name: 1, company: 1 } }).toArray();
  const orphanBranches = allBranches.filter(b => !validCompanyIds.has(b.company?.toString()));
  const validBranchIds = new Set(
    allBranches.filter(b => validCompanyIds.has(b.company?.toString())).map(b => b._id.toString())
  );

  if (orphanBranches.length === 0) {
    console.log("✅ No hay sucursales huérfanas.");
  } else {
    console.log(`⚠️  Sucursales huérfanas (${orphanBranches.length}):`);
    orphanBranches.forEach(b => console.log(`   - ${b.name} (id: ${b._id})`));
  }
  console.log();

  // 3. Documentos huérfanos en cada colección
  const orphanBranchIds = orphanBranches.map(b => b._id);
  let totalDocs = 0;
  const resumen: { col: string; count: number }[] = [];

  for (const col of BRANCH_COLLECTIONS) {
    try {
      const count = await db.collection(col).countDocuments({
        branch: { $in: orphanBranchIds }
      });
      if (count > 0) {
        resumen.push({ col, count });
        totalDocs += count;
        console.log(`  📁 ${col}: ${count} documentos huérfanos`);
      }
    } catch { /* colección puede no existir */ }
  }

  // 4. UserCompanyAccess huérfanos
  const ucaOrphans = await db.collection("usercompanyaccesses").countDocuments({
    company: { $nin: [...validCompanyIds].map(id => new Types.ObjectId(id)) }
  }).catch(() => 0);
  if (ucaOrphans > 0) {
    resumen.push({ col: "usercompanyaccesses", count: ucaOrphans });
    totalDocs += ucaOrphans;
    console.log(`  📁 usercompanyaccesses: ${ucaOrphans} registros huérfanos`);
  }

  if (totalDocs === 0 && orphanBranches.length === 0) {
    console.log("✅ No hay datos huérfanos. Base de datos limpia.");
    await mongoose.disconnect();
    return;
  }

  console.log(`\n📊 Total: ${orphanBranches.length} sucursales + ${totalDocs} documentos a eliminar.`);

  if (!APPLY) {
    console.log(`\n🔍 DRY RUN — no se modificó nada.`);
    console.log(`   Para limpiar ejecuta: npx ts-node scripts/clean-orphan-data.ts --apply`);
    await mongoose.disconnect();
    return;
  }

  // 5. Aplicar eliminaciones
  console.log("\n🗑️  Eliminando...");

  for (const { col } of resumen) {
    if (col === "usercompanyaccesses") {
      const r = await db.collection(col).deleteMany({
        company: { $nin: [...validCompanyIds].map(id => new Types.ObjectId(id)) }
      }).catch(() => ({ deletedCount: 0 }));
      console.log(`   ✅ ${col}: ${r.deletedCount} eliminados`);
    } else {
      const r = await db.collection(col).deleteMany({
        branch: { $in: orphanBranchIds }
      });
      console.log(`   ✅ ${col}: ${r.deletedCount} eliminados`);
    }
  }

  // 6. Eliminar las sucursales huérfanas
  if (orphanBranches.length > 0) {
    const r = await db.collection("branches").deleteMany({ _id: { $in: orphanBranchIds } });
    console.log(`   ✅ branches: ${r.deletedCount} sucursales huérfanas eliminadas`);
  }

  console.log("\n✅ Limpieza completada.");
  await mongoose.disconnect();
}

main().catch(err => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
