import { Request } from "express";

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

/**
 * Extrae `page` y `limit` desde la query string con valores por defecto.
 * Uso típico:
 *   const { page, limit, skip } = getPagination(req);
 *   const items = await Model.find().skip(skip).limit(limit);
 */
export function getPagination(req: Request, defaultLimit = 20, maxLimit = 100): PaginationParams {
  const page = Math.max(1, Number(req.query.page) || 1);
  const rawLimit = Number(req.query.limit) || defaultLimit;
  const limit = Math.min(Math.max(1, rawLimit), maxLimit);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function paginatedResponse<T>(
  items: T[],
  total: number,
  { page, limit }: PaginationParams
) {
  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
