import mongoose, { Schema, Document, Types } from "mongoose";

export interface IEgreso extends Document {
  branch:       Types.ObjectId;
  nroDoc:       string;
  fecha:        string;
  fechaISO:     string;
  tipo:         "GASTO" | "INVENTARIO" | "PRESTAMO";
  proveedor:    string;
  concepto:     string;
  valor:        number;
  medioPago:    string;
  items:        { productoId: string; nombre: string; cantidad: number }[];
  estado:       string;
  esInventario: boolean;
}

const egresoSchema = new Schema<IEgreso>(
  {
    branch:      { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    nroDoc:      { type: String, required: true },
    fecha:       { type: String, required: true },
    fechaISO:    { type: String, required: true },
    tipo:        { type: String, enum: ["GASTO", "INVENTARIO", "PRESTAMO"], required: true },
    proveedor:   { type: String, default: "" },
    concepto:    { type: String, default: "" },
    valor:       { type: Number, required: true },
    medioPago:   { type: String, default: "EFECTIVO" },
    items:       [{ productoId: String, nombre: String, cantidad: Number }],
    estado:      { type: String, default: "CUADRADA" },
    esInventario:{ type: Boolean, default: false },
  },
  { timestamps: true }
);

egresoSchema.index({ branch: 1, createdAt: -1 });

export default mongoose.model<IEgreso>("Egreso", egresoSchema);
