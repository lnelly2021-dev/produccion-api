import { z } from "zod";

/**
 * Esquemas de validación con zod para el módulo Example.
 * Patrón sugerido: un archivo .validator.ts por módulo, exportando
 * los schemas usados por los controladores.
 */

export const createExampleSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  active: z.boolean().optional(),
});

export const updateExampleSchema = createExampleSchema.partial();

export type CreateExampleDTO = z.infer<typeof createExampleSchema>;
export type UpdateExampleDTO = z.infer<typeof updateExampleSchema>;
