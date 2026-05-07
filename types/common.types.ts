/**
 * Tipos compartidos a lo largo de la API.
 * Para tipos específicos de un módulo, usa archivos por feature
 * (ej. `types/user.types.ts`, `types/product.types.ts`).
 */

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface IdParam {
  id: string;
}
