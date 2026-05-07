import { Request, Response, NextFunction } from "express";
import * as svc from "../../services/domicilio.service";
import { ok, created } from "../../utils/response.util";

const bid = (req: Request) => String(req.params.branchId);
const did = (req: Request) => String(req.params.domId);
const uid = (req: Request) => req.user!.userId;

export const listar = async (req: Request, res: Response, next: NextFunction) => {
  try { ok(res, await svc.listar(bid(req), uid(req))); }
  catch (err) { next(err); }
};

export const crear = async (req: Request, res: Response, next: NextFunction) => {
  try { created(res, await svc.crear(bid(req), uid(req), req.body)); }
  catch (err) { next(err); }
};

export const avanzarEstado = async (req: Request, res: Response, next: NextFunction) => {
  try { ok(res, await svc.avanzarEstado(did(req), bid(req), uid(req))); }
  catch (err) { next(err); }
};

export const cancelar = async (req: Request, res: Response, next: NextFunction) => {
  try { ok(res, await svc.cancelar(did(req), bid(req), uid(req))); }
  catch (err) { next(err); }
};
