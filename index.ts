import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { createServer } from "http";
import cookieParser from "cookie-parser";
import cors from "cors";

import connectToDatabase from "./config/db";
import { env, assertEnv } from "./config/env.config";
import { corsOptions } from "./config/cors.config";
import { setupSocketServer } from "./sockets/socket.server";
import { logger } from "./utils/Logger";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";
import { startCronJobs } from "./services/cron.service";
import { ExampleJob } from "./jobs/ExampleJob";

// ---- Routes ----------------------------------------------------------------
import exampleRoutes from "./routes/example.routes";
import authRoutes from "./routes/auth.routes";
import companyRoutes from "./routes/company.routes";
import branchRoutes from "./routes/branch.routes";
import productRoutes from "./routes/product.routes";
import mesaRoutes      from "./routes/mesa.routes";
import domicilioRoutes from "./routes/domicilio.routes";
import cierreRoutes    from "./routes/cierre.routes";
import recaudoRoutes   from "./routes/recaudo.routes";
import contactoRoutes  from "./routes/contacto.routes";
import salidaRoutes      from "./routes/salida.routes";
import ventaRoutes        from "./routes/venta.routes";
import cotizacionRoutes   from "./routes/cotizacion.routes";
import pasivoRoutes       from "./routes/pasivo.routes";
import egresoRoutes       from "./routes/egreso.routes";

// ---- App setup -------------------------------------------------------------

assertEnv();

const app = express();
const httpServer = createServer(app);

app.use(cors(corsOptions));
app.use(cookieParser());

app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ---- Health check ----------------------------------------------------------
app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true, status: "healthy" });
});

// ---- Mount routes ----------------------------------------------------------
const V = `v${env.apiVersion}`;
app.use(`/api/${V}/auth`, authRoutes);
app.use(`/api/${V}/companies`, companyRoutes);
app.use(`/api/${V}/companies`, branchRoutes);
app.use(`/api/${V}/branches/:branchId/products`, productRoutes);
app.use(`/api/${V}/branches/:branchId/mesas`,       mesaRoutes);
app.use(`/api/${V}/branches/:branchId/domicilios`,  domicilioRoutes);
app.use(`/api/${V}/branches/:branchId/cierres`,     cierreRoutes);
app.use(`/api/${V}/branches/:branchId/recaudos`,    recaudoRoutes);
app.use(`/api/${V}/branches/:branchId/contactos`,   contactoRoutes);
app.use(`/api/${V}/branches/:branchId/salidas`,       salidaRoutes);
app.use(`/api/${V}/branches/:branchId/ventas`,        ventaRoutes);
app.use(`/api/${V}/branches/:branchId/egresos`,       egresoRoutes);
app.use(`/api/${V}/branches/:branchId/cotizaciones`,  cotizacionRoutes);
app.use(`/api/${V}/branches/:branchId/pasivos`,       pasivoRoutes);
app.use(`/api/${V}/example`, exampleRoutes);

// ---- Error handlers (always at the end) ------------------------------------
app.use(notFoundHandler);
app.use(errorHandler);

// ---- Cron / Background jobs ------------------------------------------------
startCronJobs();
ExampleJob.start();

// ---- Server bootstrap ------------------------------------------------------
const startServer = async () => {
  try {
    await connectToDatabase();
    setupSocketServer(httpServer);

    httpServer.listen(env.port, () => {
      console.log(`
  ╔══════════════════════════════════════╗
  ║                                      ║
  ║   SmartPOS API ready                 ║
  ║   PORT: ${String(env.port).padEnd(28)} ║
  ║   ENV:  ${env.nodeEnv.padEnd(28)} ║
  ║                                      ║
  ╚══════════════════════════════════════╝
`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
