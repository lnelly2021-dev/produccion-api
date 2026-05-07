import { z } from "zod";
import { Request, Response, NextFunction } from "express";
import { ValidationError } from "../utils/errors";

export const createBranchSchema = z.object({
  name: z.string().min(2, "Branch name must be at least 2 characters").trim(),
  address: z.string().trim().optional(),
  phone: z.string().trim().optional(),
});

export const updateBranchSchema = createBranchSchema.partial();

export type CreateBranchDto = z.infer<typeof createBranchSchema>;
export type UpdateBranchDto = z.infer<typeof updateBranchSchema>;

export const validateCreateBranch = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const result = createBranchSchema.safeParse(req.body);
  if (!result.success) {
    const message = result.error.errors.map((e) => e.message).join(", ");
    return next(new ValidationError(message));
  }
  req.body = result.data;
  next();
};

export const validateUpdateBranch = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const result = updateBranchSchema.safeParse(req.body);
  if (!result.success) {
    const message = result.error.errors.map((e) => e.message).join(", ");
    return next(new ValidationError(message));
  }
  req.body = result.data;
  next();
};
