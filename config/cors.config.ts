import { CorsOptions } from "cors";

/**
 * Opciones CORS por defecto.
 * Ajusta `origin` según los dominios permitidos en producción.
 */
export const corsOptions: CorsOptions = {
  origin: true,
  credentials: true,
};
