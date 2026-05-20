import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { Request } from "express";

/**
 * Rate limiter genérico configurable.
 * Crea instancias específicas para endpoints sensibles
 * (login, signup, generación de PDF, etc.).
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    error: "Too many requests, please try again later",
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    error: "Too many auth attempts, please try again later",
  },
});

// Rate limiter para operaciones write por usuario autenticado.
// 60 operaciones de escritura por ventana de 15 min por usuario.
export const tenantWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => (req.user as any)?.userId ?? ipKeyGenerator(req.ip ?? "unknown"),
  message: {
    ok: false,
    error: "Too many write operations, please slow down",
  },
});
