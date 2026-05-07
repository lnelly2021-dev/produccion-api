import { Request, Response, NextFunction } from "express";
import * as ventaService from "../../services/venta.service";
import { ok, created } from "../../utils/response.util";

export const listar = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ventas = await ventaService.listar(
      String(req.params.branchId),
      req.user!.userId,
      req.query.desde as string,
      req.query.hasta as string
    );
    ok(res, ventas);
  } catch (err) { next(err); }
};

export const crear = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const venta = await ventaService.crear(String(req.params.branchId), req.user!.userId, req.body);
    created(res, venta);
  } catch (err) { next(err); }
};

export const anular = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const venta = await ventaService.anular(
      String(req.params.ventaId  || ""),
      String(req.params.branchId || ""),
      req.user!.userId,
      req.body.motivo || ""
    );
    ok(res, venta);
  } catch (err) { next(err); }
};
