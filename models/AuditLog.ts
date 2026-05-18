import mongoose, { Schema, Document, Types } from "mongoose";

export type AuditAction =
  | "VENTA_CREADA"
  | "VENTA_ANULADA"
  | "EMPRESA_CREADA"
  | "EMPRESA_ELIMINADA"
  | "MIEMBRO_AGREGADO"
  | "MIEMBRO_REMOVIDO"
  | "SUCURSAL_CREADA"
  | "SUCURSAL_ELIMINADA";

export interface IAuditLog extends Document {
  userId:       Types.ObjectId;
  companyId:    Types.ObjectId;
  branchId?:    Types.ObjectId;
  action:       AuditAction;
  resourceType: string;
  resourceId?:  string;
  meta?:        Record<string, unknown>;
  ip?:          string;
  createdAt:    Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    userId:       { type: Schema.Types.ObjectId, ref: "User",    required: true },
    companyId:    { type: Schema.Types.ObjectId, ref: "Company", required: true },
    branchId:     { type: Schema.Types.ObjectId, ref: "Branch" },
    action:       { type: String, required: true },
    resourceType: { type: String, required: true },
    resourceId:   { type: String },
    meta:         { type: Schema.Types.Mixed },
    ip:           { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ userId:    1, createdAt: -1 });
auditLogSchema.index({ companyId: 1, createdAt: -1 });
auditLogSchema.index({ branchId:  1, createdAt: -1 });

const AuditLog = mongoose.model<IAuditLog>("AuditLog", auditLogSchema);
export default AuditLog;
