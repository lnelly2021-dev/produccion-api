import mongoose, { Schema, Document, Types } from "mongoose";

interface ILineaProduccion {
  recetaId: Types.ObjectId;
  nombre: string;
  cantidad: number;
}

export interface IInformeProduccion extends Document {
  branch: Types.ObjectId;
  periodo: string;
  fecha: Date;
  lineas: ILineaProduccion[];
}

const informeProduccionSchema = new Schema<IInformeProduccion>(
  {
    branch:  { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    periodo: { type: String, required: true },
    fecha:   { type: Date, required: true },
    lineas: {
      type: [{
        recetaId: { type: Schema.Types.ObjectId, ref: "Receta" },
        nombre:   String,
        cantidad: Number,
      }],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.model<IInformeProduccion>("InformeProduccion", informeProduccionSchema);
