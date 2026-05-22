import { Request, Response, NextFunction } from "express";
import * as productService from "../../services/product.service";
import { ok, created } from "../../utils/response.util";

export const list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const products = await productService.findByBranch(
      String(req.params.branchId),
      req.user!.userId
    );
    ok(res, products);
  } catch (err) { next(err); }
};

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const product = await productService.create(
      String(req.params.branchId),
      req.user!.userId,
      req.body
    );
    created(res, product);
  } catch (err) { next(err); }
};

export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const product = await productService.update(
      String(req.params.productId),
      String(req.params.branchId),
      req.user!.userId,
      req.body
    );
    ok(res, product);
  } catch (err) { next(err); }
};

export const updateStock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const product = await productService.updateStock(
      String(req.params.productId),
      String(req.params.branchId),
      req.user!.userId,
      Number(req.body.delta)
    );
    ok(res, product);
  } catch (err) { next(err); }
};

export const remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await productService.remove(
      String(req.params.productId),
      String(req.params.branchId),
      req.user!.userId
    );
    ok(res, { deleted: true });
  } catch (err) { next(err); }
};

export const restoreInactive = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const reactivados = await productService.restoreInactive(
      String(req.params.branchId),
      req.user!.userId
    );
    ok(res, reactivados);
  } catch (err) { next(err); }
};
