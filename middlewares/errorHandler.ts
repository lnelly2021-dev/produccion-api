import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";
import { logger } from "../utils/Logger";

/**
 * Middleware central de manejo de errores.
 * Se monta al final de la cadena en `index.ts`.
 *
 * - Si el error es AppError → respeta su statusCode.
 * - Si es desconocido → 500 + log completo.
 * - En desarrollo, incluye el stack en la respuesta.
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    logger.error(
      `${err.statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`
    );
    res.status(err.statusCode).json({
      ok: false,
      error: err.message,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
    return;
  }

  logger.error(
    `500 - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`
  );
  if (err.stack) logger.error(err.stack);

  res.status(500).json({
    ok: false,
    error: "Internal server error",
    ...(process.env.NODE_ENV === "development" && {
      message: err.message,
      stack: err.stack,
    }),
  });
};

export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  res.status(404).json({
    ok: false,
    error: "Route not found",
    path: req.originalUrl,
  });
};
