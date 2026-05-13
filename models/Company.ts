import mongoose, { Schema, Document, Types } from "mongoose";

export interface IFacturacion {
  resolucion:   string;
  prefijo:      string;
  rangoDesde:   string;
  rangoHasta:   string;
  fechaVigencia:string;
}

export interface IPropinas {
  activo:       boolean;
  porcentaje:   number;
  aplicarAntes: boolean; // true = antes de impuestos, false = después
}

export interface ITributario {
  tipoActividad: string;  // "RESTAURANTE" | "MANUFACTURA" | "SERVICIOS" | "COMERCIO" | "OTRO"
  tipoImpuesto:  string;  // "IVA_19" | "IPOCONSUMO_8" | "EXENTO" | "NINGUNO"
}

export interface ICompany extends Document {
  name:        string;
  taxId?:      string;
  address?:    string;
  ciudad?:     string;
  phone?:      string;
  email?:      string;
  logo?:       string;
  facturacion: IFacturacion;
  propinas:    IPropinas;
  tributario:  ITributario;
  owner:       Types.ObjectId;
  active:      boolean;
  createdAt:   Date;
  updatedAt:   Date;
}

const companySchema = new Schema<ICompany>(
  {
    name:    { type: String, required: true, trim: true },
    taxId:   { type: String, trim: true },
    address: { type: String, trim: true },
    ciudad:  { type: String, trim: true },
    phone:   { type: String, trim: true },
    email:   { type: String, trim: true, lowercase: true },
    logo:    { type: String },
    facturacion: {
      resolucion:   { type: String, default: "" },
      prefijo:      { type: String, default: "" },
      rangoDesde:   { type: String, default: "" },
      rangoHasta:   { type: String, default: "" },
      fechaVigencia:{ type: String, default: "" },
    },
    propinas: {
      activo:       { type: Boolean, default: false },
      porcentaje:   { type: Number,  default: 10 },
      aplicarAntes: { type: Boolean, default: false },
    },
    tributario: {
      tipoActividad: { type: String, default: "RESTAURANTE" },
      tipoImpuesto:  { type: String, default: "NINGUNO" },
    },
    owner:  { type: Schema.Types.ObjectId, ref: "User", required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

companySchema.index({ owner: 1 });
companySchema.index({ taxId: 1 }, { sparse: true });

const Company = mongoose.model<ICompany>("Company", companySchema);
export default Company;
