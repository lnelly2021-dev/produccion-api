import fs from "fs";
import path from "path";
import winston from "winston";

/**
 * Este módulo expone DOS loggers complementarios:
 *
 *  1) `logger` (Winston): logger de aplicación con niveles, colores en
 *     consola y archivos rotados en `logs/`. Es el logger principal que
 *     usan los middlewares y la mayoría del código.
 *        import { logger } from "../utils/Logger";
 *
 *  2) `Logger` (clase): logger ligero por contexto, útil para etiquetar
 *     logs de un módulo concreto sin la maquinaria de Winston.
 *        import { Logger } from "../utils/Logger";
 *        const log = new Logger("UserService");
 */

// ---------------------------------------------------------------------------
// Winston (logger principal)
// ---------------------------------------------------------------------------

const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const logColors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

winston.addColors(logColors);

const format = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const transports = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize({ all: true }),
      winston.format.printf(
        (info) => `${info.timestamp} [${info.level}]: ${info.message}`
      )
    ),
  }),
  new winston.transports.File({ filename: "logs/error.log", level: "error" }),
  new winston.transports.File({ filename: "logs/combined.log" }),
];

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  levels: logLevels,
  format,
  transports,
});

// ---------------------------------------------------------------------------
// Logger por contexto (alternativa ligera)
// ---------------------------------------------------------------------------

class Logger {
  private context: string;
  private logToFile: boolean;
  private logLevel: "INFO" | "WARN" | "ERROR";

  constructor(
    context: string,
    logToFile = false,
    logLevel: "INFO" | "WARN" | "ERROR" = "INFO"
  ) {
    this.context = context;
    this.logToFile = logToFile;
    this.logLevel = logLevel;
  }

  private formatMessage(
    level: string,
    message: string,
    ...args: unknown[]
  ): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] [${this.context}] ${message} ${
      args.length ? JSON.stringify(args) : ""
    }`;
  }

  private writeToFile(message: string): void {
    const logFile = path.join(__dirname, "../logs/app.log");
    fs.appendFileSync(logFile, message + "\n");
  }

  info(message: string, ...args: unknown[]): void {
    if (this.logLevel === "INFO") {
      const formatted = this.formatMessage("INFO", message, ...args);
      console.log(formatted);
      if (this.logToFile) this.writeToFile(formatted);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.logLevel !== "ERROR") {
      const formatted = this.formatMessage("WARN", message, ...args);
      console.warn(formatted);
      if (this.logToFile) this.writeToFile(formatted);
    }
  }

  error(message: string, ...args: unknown[]): void {
    const formatted = this.formatMessage("ERROR", message, ...args);
    console.error(formatted);
    if (this.logToFile) this.writeToFile(formatted);
  }
}

export { Logger };
