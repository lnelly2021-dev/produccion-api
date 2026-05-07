/**
 * Store en memoria para tracking de presencia de usuarios.
 * Útil para mostrar "online/offline" en una UI.
 *
 * Para clusters, reemplazar por Redis pub/sub.
 */

interface UserConnection {
  userId: string;
  [key: string]: unknown;
}

const connections = new Map<string, UserConnection>(); // socketId → user

export function addConnection(socketId: string, user: UserConnection): void {
  connections.set(socketId, user);
}

export function removeConnection(socketId: string): UserConnection | null {
  const user = connections.get(socketId) ?? null;
  connections.delete(socketId);
  return user;
}

export function getOnlineUsers(): UserConnection[] {
  return Array.from(connections.values());
}
