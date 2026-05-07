import Example, { IExample } from "../models/Example";
import { PaginationParams } from "../utils/pagination.util";

/**
 * Service de ejemplo. Toda la lógica de negocio vive aquí;
 * los controladores solo orquestan request/response.
 *
 * Reemplaza con tus services reales (productService, saleService, etc.).
 */

export async function list(
  { skip, limit }: PaginationParams
): Promise<{ items: IExample[]; total: number }> {
  const [items, total] = await Promise.all([
    Example.find().skip(skip).limit(limit).sort({ createdAt: -1 }),
    Example.countDocuments(),
  ]);
  return { items, total };
}

export function findById(id: string): Promise<IExample | null> {
  return Example.findById(id);
}

export function create(data: Partial<IExample>): Promise<IExample> {
  return Example.create(data);
}

export function update(
  id: string,
  data: Partial<IExample>
): Promise<IExample | null> {
  return Example.findByIdAndUpdate(id, data, { new: true });
}

export async function remove(id: string): Promise<boolean> {
  const result = await Example.findByIdAndDelete(id);
  return !!result;
}
