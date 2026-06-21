import mongoose, { Schema, Document, Types } from "mongoose";

interface IEmpleado { nombre: string; salario: number; prestaciones: number; }
interface ICIF      { concepto: string; valorMes: number; }
interface IGasto    { concepto: string; valorMes: number; }

export interface ICostoProduccion extends Document {
  branch:                Types.ObjectId;
  diasLaborales:         number;
  horasDia:              number;
  empleados:             IEmpleado[];
  cif:                   ICIF[];
  personalVentas:        IEmpleado[];
  gastosVentas:          IGasto[];
  personalAdmon:         IEmpleado[];
  gastosAdmon:           IGasto[];
  ventasMensual:         number;
  admonMensual:          number;
  baseMensual:           number;
}

const costoProduccionSchema = new Schema<ICostoProduccion>(
  {
    branch:        { type: Schema.Types.ObjectId, ref: "Branch", required: true, unique: true },
    diasLaborales: { type: Number, default: 26 },
    horasDia:      { type: Number, default: 15 },
    empleados:          { type: [{ nombre: String, salario: Number, prestaciones: { type: Number, default: 48 } }], default: [] },
    cif:           { type: [{ concepto: String, valorMes: Number }], default: [] },
    personalVentas: { type: [{ nombre: String, salario: Number, prestaciones: { type: Number, default: 0 } }], default: [] },
    gastosVentas:  { type: [{ concepto: String, valorMes: Number }], default: [] },
    personalAdmon:  { type: [{ nombre: String, salario: Number, prestaciones: { type: Number, default: 0 } }], default: [] },
    gastosAdmon:   { type: [{ concepto: String, valorMes: Number }], default: [] },
    ventasMensual:         { type: Number, default: 0 },
    admonMensual:          { type: Number, default: 0 },
    baseMensual:           { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<ICostoProduccion>("CostoProduccion", costoProduccionSchema);
