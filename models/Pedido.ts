import mongoose, { Schema, Document, Types } from "mongoose";

interface IItem {
  productoId: string;
  nombre:     string;
  cantidad:   number;
  precio:     number;
  subtotal:   number;
  notas?:     string;
}

export interface IPedido extends Document {
  branch:  Types.ObjectId;
  mesa:    Types.ObjectId;
  mesero:  string;
  items:   IItem[];
  estado:  "activo" | "facturado" | "cancelado";
}

const itemSchema = new Schema<IItem>(
  {
    productoId: { type: String, required: true },
    nombre:     { type: String, required: true },
    cantidad:   { type: Number, required: true, min: 0 },
    precio:     { type: Number, required: true },
    subtotal:   { type: Number, required: true },
    notas:      { type: String },
  },
  { _id: false }
);

const pedidoSchema = new Schema<IPedido>(
  {
    branch:  { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    mesa:    { type: Schema.Types.ObjectId, ref: "Mesa",   required: true },
    mesero:  { type: String, default: "" },
    items:   { type: [itemSchema], default: [] },
    estado:  { type: String, enum: ["activo", "facturado", "cancelado"], default: "activo" },
  },
  { timestamps: true }
);

pedidoSchema.index({ branch: 1, mesa: 1, estado: 1 });

export default mongoose.model<IPedido>("Pedido", pedidoSchema);
