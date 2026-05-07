import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "../config/env.config";

let io: Server;

export interface SocketUserData {
  userId: string;
  role: string;
  [key: string]: unknown;
}

/**
 * Inicializa Socket.IO sobre el servidor HTTP existente.
 * Llamar una sola vez al arrancar la app.
 */
export function setupSocketServer(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: { origin: true, credentials: true },
    pingInterval: 15000,
    pingTimeout: 10000,
  });

  // Middleware de autenticación de sockets
  io.use((socket: Socket, next) => {
    const { token, userId, role } = socket.handshake.auth;
    if (!token || !userId) {
      return next(new Error("auth:missing_fields"));
    }
    try {
      jwt.verify(token, env.jwtSecret);
    } catch {
      return next(new Error("auth:invalid_token"));
    }

    socket.data = {
      userId,
      role: role || "user",
    } as SocketUserData;

    next();
  });

  io.on("connection", (socket: Socket) => {
    const user = socket.data as SocketUserData;
    socket.join(`user:${user.userId}`);

    // TODO: registrar handlers de cada subsistema
    // registerXxxHandlers(io, socket);

    socket.on("disconnect", () => {
      // hooks de desconexión si fueran necesarios
    });
  });

  console.log("  ⚡ Socket.IO server initialized");
  return io;
}

/**
 * Acceso al singleton de io para emitir desde controladores REST.
 * Llamar SIEMPRE después de setupSocketServer().
 */
export function getIO(): Server {
  if (!io) {
    throw new Error("Socket.IO not initialized. Call setupSocketServer() first.");
  }
  return io;
}
