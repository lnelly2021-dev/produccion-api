/**
 * Script: elimina completamente la empresa DEMO y todos sus datos.
 * Uso: npx ts-node scripts/delete-demo-company.ts [--apply]
 */

import mongoose, { Types } from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const APPLY = process.argv.includes("--apply");

const BRANCH_COLLECTIONS = [
  "products", "ventas", "egresos", "recaudos", "pasivos",
  "cotizaciones", "cierres", "mesas", "pedidos", "domicilios", "contactos",
];

async function main() {
  await mongoose.connect(process.env.MONGO_URI!);
  console.log("✅ Conectado a MongoDB\n");
  const db = mongoose.connection.db!;

  // 1. Encontrar la empresa DEMO
  const demo = await db.collection("companies").findOne({ name: /^demo$/i });
  if (!demo) {
    console.log("✅ No existe ninguna empresa llamada DEMO.");
    await mongoose.disconnect();
    return;
  }
  console.log(`🏢 Empresa encontrada: "${demo.name}" (id: ${demo._id})\n`);

  // 2. Sucursales del DEMO
  const branches = await db.collection("branches").find({ company: demo._id }).toArray();
  const branchIds = branches.map(b => b._id);
  console.log(`📍 Sucursales (${branches.length}): ${branches.map(b => b.name).join(", ") || "ninguna"}`);

  // 3. Contar documentos a eliminar por colección
  let total = 0;
  const resumen: { col: string; count: number }[] = [];

  for (const col of BRANCH_COLLECTIONS) {
    if (branchIds.length === 0) break;
    const count = await db.collection(col).countDocuments({ branch: { $in: branchIds } }).catch(() => 0);
    if (count > 0) { resumen.push({ col, count }); total += count; }
  }

  // UserCompanyAccess
  const ucaCount = await db.collection("usercompanyaccesses")
    .countDocuments({ company: demo._id }).catch(() => 0);
  if (ucaCount > 0) { resumen.push({ col: "usercompanyaccesses (accesos)", count: ucaCount }); total += ucaCount; }

  // AuditLogs
  const auditCount = await db.collection("auditlogs")
    .countDocuments({ company: demo._id }).catch(() => 0);
  if (auditCount > 0) { resumen.push({ col: "auditlogs", count: auditCount }); total += auditCount; }

  console.log(`\n⚠️  Datos a eliminar:`);
  resumen.forEach(r => console.log(`   📁 ${r.col}: ${r.count} documentos`));
  console.log(`   🏢 company: 1 (la empresa DEMO)`);
  console.log(`   📍 branches: ${branchIds.length}`);
  console.log(`\n📊 Total: ${total} documentos + ${branchIds.length} sucursales + 1 empresa`);

  if (!APPLY) {
    console.log(`\n🔍 DRY RUN — no se modificó nada.`);
    console.log(`   Para eliminar ejecuta: npx ts-node scripts/delete-demo-company.ts --apply`);
    await mongoose.disconnect();
    return;
  }

  // 4. Eliminar todo
  console.log("\n🗑️  Eliminando...");

  for (const { col } of resumen) {
    if (col.startsWith("usercompanyaccesses")) {
      const r = await db.collection("usercompanyaccesses").deleteMany({ company: demo._id });
      console.log(`   ✅ usercompanyaccesses: ${r.deletedCount} eliminados`);
    } else if (col === "auditlogs") {
      const r = await db.collection("auditlogs").deleteMany({ company: demo._id });
      console.log(`   ✅ auditlogs: ${r.deletedCount} eliminados`);
    } else if (branchIds.length > 0) {
      const r = await db.collection(col).deleteMany({ branch: { $in: branchIds } });
      console.log(`   ✅ ${col}: ${r.deletedCount} eliminados`);
    }
  }

  if (branchIds.length > 0) {
    const r = await db.collection("branches").deleteMany({ company: demo._id });
    console.log(`   ✅ branches: ${r.deletedCount} eliminadas`);
  }

  await db.collection("companies").deleteOne({ _id: demo._id });
  console.log(`   ✅ company DEMO: eliminada`);

  console.log("\n✅ DEMO eliminado completamente de la base de datos.");
  await mongoose.disconnect();
}

main().catch(err => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
