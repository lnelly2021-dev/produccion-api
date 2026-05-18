import AuditLog, { AuditAction } from "../models/AuditLog";
import { logger } from "./Logger";

interface AuditParams {
  userId:       string;
  companyId:    string;
  branchId?:    string;
  action:       AuditAction;
  resourceType: string;
  resourceId?:  string;
  meta?:        Record<string, unknown>;
  ip?:          string;
}

/**
 * Registra una acción crítica en el log de auditoría.
 * Fire-and-forget: no lanzar await en los llamadores para no bloquear la respuesta.
 * Los errores se loguean en consola pero nunca burbujean al handler.
 */
export function logAudit(params: AuditParams): void {
  AuditLog.create({
    userId:       params.userId,
    companyId:    params.companyId,
    branchId:     params.branchId,
    action:       params.action,
    resourceType: params.resourceType,
    resourceId:   params.resourceId,
    meta:         params.meta,
    ip:           params.ip,
  }).catch((err) => {
    logger.error(`[audit] Failed to write audit log: ${err?.message}`);
  });
}
