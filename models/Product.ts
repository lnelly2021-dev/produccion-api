import mongoose, { Schema, Document, Types } from "mongoose";

export interface IComponente {
  productoId: Types.ObjectId;
  cantidad:   number;
}

export interface IProduct extends Document {
  branch:          Types.ObjectId;
  nombre:          string;
  categoria:       string;
  presentacion:    string;
  precioPublico:   number;
  precioMayorista: number;
  tarifaIVA:       number;  // 0 | 5 | 19
  stock:           number;
  stockInicial:    number;
  stockCombo:      number;
  foto?:           string;
  componentes:     IComponente[];
  active:          boolean;
  createdAt:       Date;
  updatedAt:       Date;
}

const productSchema = new Schema<IProduct>(
  {
    branch:          { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    nombre:          { type: String, required: true, trim: true },
    categoria:       { type: String, trim: true, default: "GENERAL" },
    presentacion:    { type: String, trim: true, default: "UND" },
    precioPublico:   { type: Number, default: 0 },
    precioMayorista: { type: Number, default: 0 },
    tarifaIVA:       { type: Number, default: 0 },
    stock:           { type: Number, default: 0 },
    stockInicial:    { type: Number, default: 0 },
    stockCombo:      { type: Number, default: 0 },
    foto:            { type: String, default: "" },
    componentes: [{
      productoId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
      cantidad:   { type: Number, required: true, min: 1 },
    }],
    active:          { type: Boolean, default: true },
  },
  { timestamps: true }
);

productSchema.index({ branch: 1, active: 1 });
productSchema.index({ branch: 1, categoria: 1 });

const Product = mongoose.model<IProduct>("Product", productSchema);
export default Product;
