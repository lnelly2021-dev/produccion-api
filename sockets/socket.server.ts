import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "../config/env.config";

// Extrae branchId del JWT para unirse a la sala correcta
function getBranchFromToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, env.jwtSecret) as any;
    return payload.branchId || null;
  } catch { return null; }
}

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

    // Unir al room de la sucursal para recibir eventos en tiempo real
    const token = socket.handshake.auth.token;
    const branchId = getBranchFromToken(token);
    if (branchId) {
      socket.join(`branch:${branchId}`);
      socket.data.branchId = branchId;
    }

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

/**
 * Emite un evento a todos los sockets conectados en una sucursal.
 * Usar desde servicios REST para notificar en tiempo real.
 */
export function emitToBranch(branchId: string, event: string, data: unknown): void {
  if (!io) return;
  io.to(`branch:${branchId}`).emit(event, data);
}
