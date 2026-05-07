import { Request, Response, NextFunction } from "express";

/**
 * Middleware genérico para validar campos requeridos en req.body.
 * Uso:
 *   router.post("/", validateFields(["name", "email"]), controller);
 */
export const validateFields = (requiredFields: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const missingFields: string[] = [];

    requiredFields.forEach((field) => {
      if (req.body[field] === undefined || req.body[field] === null || req.body[field] === "") {
        missingFields.push(field);
      }
    });

    if (missingFields.length > 0) {
      res.status(400).json({
        ok: false,
        error: "Mandatory fields are missing",
        missingFields,
      });
      return;
    }

    next();
  };
};
