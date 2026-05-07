import { IExample } from "../models/Example";

/**
 * Mappers traducen entre la forma del modelo (Mongo) y la forma
 * que se devuelve al cliente o se envía a sistemas externos.
 *
 * Mantén aquí cualquier transformación, omisión o renombre de campos.
 */

export interface ExampleDTO {
  id: string;
  name: string;
  description: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export function toExampleDTO(doc: IExample): ExampleDTO {
  return {
    id: doc._id?.toString() ?? "",
    name: doc.name,
    description: doc.description ?? "",
    active: doc.active,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
