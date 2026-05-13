import { z } from "zod";
import { Request, Response, NextFunction } from "express";
import { ValidationError } from "../utils/errors";

const facturacionSchema = z.object({
  resolucion:   z.string().optional(),
  prefijo:      z.string().optional(),
  rangoDesde:   z.string().optional(),
  rangoHasta:   z.string().optional(),
  fechaVigencia:z.string().optional(),
}).optional();

const propinasSchema = z.object({
  activo:       z.boolean().optional(),
  porcentaje:   z.number().optional(),
  aplicarAntes: z.boolean().optional(),
}).optional();

const tributarioSchema = z.object({
  tipoActividad: z.string().optional(),
  tipoImpuesto:  z.string().optional(),
}).optional();

export const createCompanySchema = z.object({
  name:        z.string().min(2, "Company name must be at least 2 characters").trim(),
  taxId:       z.string().trim().optional(),
  address:     z.string().trim().optional(),
  ciudad:      z.string().trim().optional(),
  phone:       z.string().trim().optional(),
  email:       z.string().email("Invalid email format").toLowerCase().optional()
                .or(z.literal("")),
  logo:        z.string().optional(),
  facturacion: facturacionSchema,
  propinas:    propinasSchema,
  tributario:  tributarioSchema,
});

export const updateCompanySchema = createCompanySchema.partial();

export type CreateCompanyDto = z.infer<typeof createCompanySchema>;
export type UpdateCompanyDto = z.infer<typeof updateCompanySchema>;

export const validateCreateCompany = (
  req: Request, _res: Response, next: NextFunction
): void => {
  const result = createCompanySchema.safeParse(req.body);
  if (!result.success) {
    const message = result.error.errors.map((e) => e.message).join(", ");
    return next(new ValidationError(message));
  }
  req.body = result.data;
  next();
};

export const validateUpdateCompany = (
  req: Request, _res: Response, next: NextFunction
): void => {
  const result = updateCompanySchema.safeParse(req.body);
  if (!result.success) {
    const message = result.error.errors.map((e) => e.message).join(", ");
    return next(new ValidationError(message));
  }
  req.body = result.data;
  next();
};
