import { Request, Response, NextFunction } from "express";
import * as mesaService from "../../services/mesa.service";
import * as pedidoService from "../../services/pedido.service";
import * as ventaService from "../../services/venta.service";
import { ok, created } from "../../utils/response.util";

const branchId = (req: Request) => String(req.params.branchId);
const mesaId   = (req: Request) => String(req.params.mesaId);
const userId   = (req: Request) => req.user!.userId;

export const listar = async (req: Request, res: Response, next: NextFunction) => {
  try { ok(res, await mesaService.findAll(branchId(req), userId(req))); }
  catch (err) { next(err); }
};

export const crear = async (req: Request, res: Response, next: NextFunction) => {
  try { created(res, await mesaService.crear(branchId(req), userId(req))); }
  catch (err) { next(err); }
};

export const inicializar = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mesas = await mesaService.inicializar(branchId(req), userId(req), Number(req.body.cantidad) || 4);
    created(res, mesas);
  } catch (err) { next(err); }
};

export const asignarMesero = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mesa = await mesaService.asignarMesero(mesaId(req), branchId(req), userId(req), req.body.mesero || "");
    ok(res, mesa);
  } catch (err) { next(err); }
};

export const liberar = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await mesaService.liberarMesa(mesaId(req), branchId(req), userId(req));
    ok(res, { liberada: true });
  } catch (err) { next(err); }
};

export const eliminar = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await mesaService.eliminar(mesaId(req), branchId(req), userId(req));
    ok(res, { eliminada: true });
  } catch (err) { next(err); }
};

// ── Pedido activo ──────────────────────────────────────────────────────────
export const getPedido = async (req: Request, res: Response, next: NextFunction) => {
  try { ok(res, await pedidoService.getActivo(mesaId(req), branchId(req), userId(req))); }
  catch (err) { next(err); }
};

export const guardarPedido = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pedido = await pedidoService.guardar(mesaId(req), branchId(req), userId(req), req.body.items || []);
    ok(res, pedido);
  } catch (err) { next(err); }
};

// ── Facturar ────────────────────────────────────────────────────────────────
export const facturar = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const venta = await ventaService.crear(branchId(req), userId(req), { ...req.body, mesaId: mesaId(req) });
    created(res, venta);
  } catch (err) { next(err); }
};
