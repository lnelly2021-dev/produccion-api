import { Request, Response, NextFunction } from "express";
import * as exampleService from "../../services/example.service";
import { ok, created } from "../../utils/response.util";
import { getPagination, paginatedResponse } from "../../utils/pagination.util";
import { NotFoundError } from "../../utils/errors";

/**
 * Controlador de ejemplo. Sirve como referencia del patrón:
 *   - Validación → middleware
 *   - Lógica de negocio → service
 *   - Respuesta → utils/response
 *
 * Reemplaza con tus controladores reales.
 */

export const list = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const pagination = getPagination(req);
    const { items, total } = await exampleService.list(pagination);
    ok(res, paginatedResponse(items, total, pagination));
  } catch (err) {
    next(err);
  }
};

export const getById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const item = await exampleService.findById(String(req.params.id));
    if (!item) throw new NotFoundError("Example no encontrado");
    ok(res, item);
  } catch (err) {
    next(err);
  }
};

export const create = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const item = await exampleService.create(req.body);
    created(res, item);
  } catch (err) {
    next(err);
  }
};

export const update = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const item = await exampleService.update(String(req.params.id), req.body);
    if (!item) throw new NotFoundError("Example no encontrado");
    ok(res, item);
  } catch (err) {
    next(err);
  }
};

export const remove = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const deleted = await exampleService.remove(String(req.params.id));
    if (!deleted) throw new NotFoundError("Example no encontrado");
    ok(res, { deleted: true });
  } catch (err) {
    next(err);
  }
};
