import Mesa from "../models/Mesa";
import Pedido from "../models/Pedido";
import UserCompanyAccess from "../models/UserCompanyAccess";
import { NotFoundError, ForbiddenError } from "../utils/errors";

async function assertAccess(branchId: string, userId: string) {
  const access = await UserCompanyAccess.findOne({ user: userId, branches: branchId, active: true });
  if (!access) throw new ForbiddenError("Access denied");
  return access;
}

export async function findAll(branchId: string, userId: string) {
  await assertAccess(branchId, userId);
  const mesas = await Mesa.find({ branch: branchId, active: true }).sort({ numero: 1 }).lean();

  // Adjuntar pedido activo a cada mesa
  const pedidos = await Pedido.find({ branch: branchId, estado: "activo" }).lean();
  const pedidoMap: Record<string, any> = {};
  pedidos.forEach(p => { pedidoMap[String(p.mesa)] = p; });

  return mesas.map(m => ({
    ...m,
    pedidoActivo: pedidoMap[String(m._id)] || null,
    estado: pedidoMap[String(m._id)] ? "ocupada" : (m.mesero ? "ocupada" : "libre"),
  }));
}

export async function inicializar(branchId: string, userId: string, cantidad: number) {
  await assertAccess(branchId, userId);
  const existentes = await Mesa.countDocuments({ branch: branchId, active: true });
  if (existentes > 0) return findAll(branchId, userId);

  const mesas = Array.from({ length: cantidad }, (_, i) => ({
    branch: branchId, nombre: `Mesa ${i + 1}`, numero: i + 1,
    estado: "libre" as const, mesero: "",
  }));
  await Mesa.insertMany(mesas);
  return findAll(branchId, userId);
}

export async function crear(branchId: string, userId: string) {
  await assertAccess(branchId, userId);
  const mesas = await Mesa.find({ branch: branchId, active: true }).sort({ numero: -1 }).limit(1);
  const siguienteNumero = mesas.length > 0 ? mesas[0].numero + 1 : 1;
  return Mesa.create({
    branch: branchId,
    nombre: `Mesa ${siguienteNumero}`,
    numero: siguienteNumero,
    estado: "libre",
    mesero: "",
  });
}

export async function asignarMesero(mesaId: string, branchId: string, userId: string, mesero: string) {
  await assertAccess(branchId, userId);
  const mesa = await Mesa.findOneAndUpdate(
    { _id: mesaId, branch: branchId, active: true },
    { mesero, estado: mesero ? "ocupada" : "libre" },
    { new: true }
  );
  if (!mesa) throw new NotFoundError("Mesa no encontrada");
  return mesa;
}

export async function liberarMesa(mesaId: string, branchId: string, userId: string) {
  await assertAccess(branchId, userId);
  await Mesa.findOneAndUpdate(
    { _id: mesaId, branch: branchId },
    { mesero: "", estado: "libre" }
  );
  await Pedido.findOneAndUpdate(
    { mesa: mesaId, branch: branchId, estado: "activo" },
    { estado: "cancelado" }
  );
}
