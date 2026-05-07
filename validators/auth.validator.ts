import { z } from "zod";
import { Request, Response, NextFunction } from "express";
import { ValidationError } from "../utils/errors";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").trim(),
  email: z.string().email("Invalid email format").toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  companyName: z.string().min(2, "Company name must be at least 2 characters").trim(),
  taxId: z.string().trim().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format").toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;

export const validateRegister = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    const message = result.error.errors.map((e) => e.message).join(", ");
    return next(new ValidationError(message));
  }
  req.body = result.data;
  next();
};

export const validateLogin = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    const message = result.error.errors.map((e) => e.message).join(", ");
    return next(new ValidationError(message));
  }
  req.body = result.data;
  next();
};
