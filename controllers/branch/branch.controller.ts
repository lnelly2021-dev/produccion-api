import { Request, Response, NextFunction } from "express";
import * as branchService from "../../services/branch.service";
import { ok, created } from "../../utils/response.util";

export const create = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const branch = await branchService.create(
      String(req.params.companyId),
      req.user!.userId,
      req.body
    );
    created(res, branch);
  } catch (err) {
    next(err);
  }
};

export const list = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const branches = await branchService.findByCompany(
      String(req.params.companyId),
      req.user!.userId
    );
    ok(res, branches);
  } catch (err) {
    next(err);
  }
};

export const getById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const branch = await branchService.findById(
      String(req.params.branchId),
      String(req.params.companyId),
      req.user!.userId
    );
    ok(res, branch);
  } catch (err) {
    next(err);
  }
};

export const update = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const branch = await branchService.update(
      String(req.params.branchId),
      String(req.params.companyId),
      req.user!.userId,
      req.body
    );
    ok(res, branch);
  } catch (err) {
    next(err);
  }
};

export const remove = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await branchService.softDelete(
      String(req.params.branchId),
      String(req.params.companyId),
      req.user!.userId
    );
    ok(res, { deleted: true });
  } catch (err) {
    next(err);
  }
};
