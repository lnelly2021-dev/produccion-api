import { Response } from "express";
import { HTTP_STATUS } from "./httpStatus";

/**
 * Helpers para emitir respuestas con un shape consistente.
 * Todos los endpoints deben devolver: { ok, data?, error? }.
 */
export function ok<T>(res: Response, data: T, status = HTTP_STATUS.OK): Response {
  return res.status(status).json({ ok: true, data });
}

export function created<T>(res: Response, data: T): Response {
  return res.status(HTTP_STATUS.CREATED).json({ ok: true, data });
}

export function fail(
  res: Response,
  message: string,
  status = HTTP_STATUS.BAD_REQUEST,
  extra: Record<string, unknown> = {}
): Response {
  return res.status(status).json({ ok: false, error: message, ...extra });
}
