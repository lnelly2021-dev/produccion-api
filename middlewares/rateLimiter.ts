import rateLimit from "express-rate-limit";

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
