import { Request, Response, NextFunction } from "express";
import * as reporteService from "../../services/reporte.service";
import { ok } from "../../utils/response.util";

export const impuestos = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { desde, hasta } = req.query as { desde?: string; hasta?: string };
    if (!desde || !hasta) {
      res.status(400).json({ message: "Se requieren parámetros desde y hasta (YYYY-MM-DD)" });
      return;
    }
    const data = await reporteService.reporteImpuestos(
      String(req.params.branchId),
      req.user!.userId,
      desde,
      hasta
    );
    ok(res, data);
  } catch (err) { next(err); }
};
