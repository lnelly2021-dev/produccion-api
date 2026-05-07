import mongoose, { Schema, Document, Types } from "mongoose";

export type TipoContacto = "CLIENTE" | "PROVEEDOR" | "EMPLEADO";

export interface IContacto extends Document {
  branch:        Types.ObjectId;
  tipo:          TipoContacto;
  nombre:        string;
  apellidos:     string;
  identificacion:string;
  telefono:      string;
  email:         string;
  direccion:     string;
  // Campos extra por tipo
  cargo?:        string;   // empleado
  salario?:      number;   // empleado
  activo:        boolean;
}

const contactoSchema = new Schema<IContacto>(
  {
    branch:         { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    tipo:           { type: String, enum: ["CLIENTE","PROVEEDOR","EMPLEADO"], required: true },
    nombre:         { type: String, required: true, trim: true },
    apellidos:      { type: String, default: "" },
    identificacion: { type: String, default: "" },
    telefono:       { type: String, default: "" },
    email:          { type: String, default: "" },
    direccion:      { type: String, default: "" },
    cargo:          { type: String },
    salario:        { type: Number },
    activo:         { type: Boolean, default: true },
  },
  { timestamps: true }
);

contactoSchema.index({ branch: 1, tipo: 1, activo: 1 });

export default mongoose.model<IContacto>("Contacto", contactoSchema);
