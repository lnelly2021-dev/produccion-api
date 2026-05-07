import mongoose, { Schema, Document } from "mongoose";

/**
 * Modelo de ejemplo. Reemplaza con tus entidades reales
 * (Product, Sale, Customer, etc.).
 *
 * Convenciones del template:
 *  - Una interfaz IXxx para tipar el documento.
 *  - Schema con `timestamps: true`.
 *  - Índices al final, antes de `mongoose.model(...)`.
 */
export interface IExample extends Document {
  name: string;
  description?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const exampleSchema: Schema<IExample> = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

exampleSchema.index({ name: 1 });

const Example = mongoose.model<IExample>("Example", exampleSchema);
export default Example;
