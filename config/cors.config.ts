import { CorsOptions } from "cors";

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : [];

// En development se permiten orígenes locales; en producción solo los de ALLOWED_ORIGINS.
const isDev = process.env.NODE_ENV !== "production";

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // same-origin requests
    if (isDev) return callback(null, true);   // dev: permitir todo
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
};
