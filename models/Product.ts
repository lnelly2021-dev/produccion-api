import mongoose, { Schema, Document, Types } from "mongoose";

export interface IProduct extends Document {
  branch:          Types.ObjectId;
  nombre:          string;
  categoria:       string;
  presentacion:    string;
  precioPublico:   number;
  precioMayorista: number;
  stock:           number;
  stockInicial:    number;
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
    stock:           { type: Number, default: 0 },
    stockInicial:    { type: Number, default: 0 },
    active:          { type: Boolean, default: true },
  },
  { timestamps: true }
);

productSchema.index({ branch: 1, active: 1 });
productSchema.index({ branch: 1, categoria: 1 });

const Product = mongoose.model<IProduct>("Product", productSchema);
export default Product;
