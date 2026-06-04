import mongoose, { Schema, Document, Types } from "mongoose";

export interface IHojaCosto extends Document {
  branch:            Types.ObjectId;
  recetaId:          Types.ObjectId;
  producto:          string;
  tamanoLote:        number;
  // Componentes del costo
  costoMP:           number;   // Materia prima
  costoMO:           number;   // Mano de obra directa
  costoFijo:         number;   // Costos fijos
  costoVariable:     number;   // Costos variables
  costoIndirecto:    number;   // CIF
  costoComercial:    number;   // Costos comerciales
  costoAdmin:        number;   // Costos administrativos
  // Totales
  costoTotalLote:    number;
  costoUnitario:     number;
  // Precio sugerido
  margenDeseado:     number;   // % de margen
  precioSugerido:    number;
  fechaCalculo:      Date;
  detalle:           any[];    // snapshot de centros de costo aplicados
}

const hojaCostoSchema = new Schema<IHojaCosto>(
  {
    branch:         { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    recetaId:       { type: Schema.Types.ObjectId, ref: "Receta" },
    producto:       { type: String, required: true },
    tamanoLote:     { type: Number, default: 1 },
    costoMP:        { type: Number, default: 0 },
    costoMO:        { type: Number, default: 0 },
    costoFijo:      { type: Number, default: 0 },
    costoVariable:  { type: Number, default: 0 },
    costoIndirecto: { type: Number, default: 0 },
    costoComercial: { type: Number, default: 0 },
    costoAdmin:     { type: Number, default: 0 },
    costoTotalLote: { type: Number, default: 0 },
    costoUnitario:  { type: Number, default: 0 },
    margenDeseado:  { type: Number, default: 0 },
    precioSugerido: { type: Number, default: 0 },
    fechaCalculo:   { type: Date, default: Date.now },
    detalle:        [{ type: Schema.Types.Mixed }],
  },
  { timestamps: true }
);

hojaCostoSchema.index({ branch: 1, recetaId: 1 });
export default mongoose.model<IHojaCosto>("HojaCosto", hojaCostoSchema);
