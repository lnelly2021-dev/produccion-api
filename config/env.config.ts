export const env = {
  // ---- Server ----
  port: Number(process.env.PORT) || 5000,
  apiVersion: process.env.VERSION || "1",
  nodeEnv: process.env.NODE_ENV || "development",

  // ---- Database ----
  mongoUri: process.env.MONGO_URI || "",

  // ---- Auth / JWT ----
  jwtSecret: process.env.JWT_SECRET || "",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "15m",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",

  // ---- Frontend / CORS ----
  frontendUrl: process.env.FRONTEND_URL || "*",
} as const;

export function assertEnv(): void {
  const required: Array<keyof typeof env> = [
    "mongoUri",
    "jwtSecret",
    "jwtRefreshSecret",
  ];
  const missing = required.filter((key) => !env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
}
