import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { createServer } from "http";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";

import connectToDatabase from "./config/db";
import { env, assertEnv } from "./config/env.config";
import { corsOptions } from "./config/cors.config";
import { logger } from "./utils/Logger";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";
import { authMiddleware } from "./middlewares/auth.middleware";
import { branchAccessMiddleware } from "./middlewares/branch.access.middleware";
import { tenantWriteLimiter } from "./middlewares/rateLimiter";

// ── Rutas base (auth + empresas) ─────────────────────────────────────────────
import authRoutes     from "./routes/auth.routes";
import companyRoutes  from "./routes/company.routes";
import branchRoutes   from "./routes/branch.routes";
import contactoRoutes from "./routes/contacto.routes";

// ── Rutas de Producción ───────────────────────────────────────────────────────
import ingredienteRoutes from "./routes/ingrediente.routes";
import recetaRoutes      from "./routes/receta.routes";
import centroCostoRoutes from "./routes/centroCosto.routes";
import hojaCostoRoutes   from "./routes/hojaCosto.routes";

assertEnv();

const app        = express();
const httpServer = createServer(app);

app.use(helmet({ crossOriginResourcePolicy: false, contentSecurityPolicy: false }));
app.use(cors(corsOptions));
app.use(cookieParser());
app.use((req, _res, next) => { logger.info(`${req.method} ${req.path}`); next(); });
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req, res) => res.status(200).json({ ok: true, app: "produccion-api" }));

const V = `v${env.apiVersion}`;

app.use(`/api/${V}/auth`,      authRoutes);
app.use(`/api/${V}/companies`, companyRoutes);
app.use(`/api/${V}/companies`, branchRoutes);

app.use(`/api/${V}/branches/:branchId`, authMiddleware, branchAccessMiddleware);
app.use(`/api/${V}/branches/:branchId`, tenantWriteLimiter);

app.use(`/api/${V}/branches/:branchId/contactos`,     contactoRoutes);
app.use(`/api/${V}/branches/:branchId/ingredientes`,  ingredienteRoutes);
app.use(`/api/${V}/branches/:branchId/recetas`,       recetaRoutes);
app.use(`/api/${V}/branches/:branchId/centros-costo`, centroCostoRoutes);
app.use(`/api/${V}/branches/:branchId/hojas-costo`,   hojaCostoRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async () => {
  await connectToDatabase();
  httpServer.listen(env.port, () => {
    console.log(`\n  ╔══════════════════════════════════╗`);
    console.log(`  ║   Producción API  PORT:${env.port}  ║`);
    console.log(`  ╚══════════════════════════════════╝\n`);
  });
};

startServer();
