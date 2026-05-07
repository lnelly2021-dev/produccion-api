import { Request, Response, NextFunction } from "express";
import * as companyService from "../../services/company.service";
import { ok, created } from "../../utils/response.util";

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const company = await companyService.create(req.user!.userId, req.body);
    created(res, company);
  } catch (err) { next(err); }
};

export const list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const companies = await companyService.findByUser(req.user!.userId);
    ok(res, companies);
  } catch (err) { next(err); }
};

export const getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const company = await companyService.findById(String(req.params.id), req.user!.userId);
    ok(res, company);
  } catch (err) { next(err); }
};

export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const company = await companyService.update(String(req.params.id), req.user!.userId, req.body);
    ok(res, company);
  } catch (err) { next(err); }
};

export const remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await companyService.softDelete(String(req.params.id), req.user!.userId);
    ok(res, { deleted: true });
  } catch (err) { next(err); }
};

// ── members ───────────────────────────────────────────────────────────────────

export const listMembers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const members = await companyService.listMembers(String(req.params.id), req.user!.userId);
    ok(res, members);
  } catch (err) { next(err); }
};

export const addMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, role, branchIds, allBranches } = req.body as {
      email: string;
      role: "admin" | "manager" | "cashier";
      branchIds?: string[];
      allBranches?: boolean;
    };
    const access = await companyService.addMember(
      String(req.params.id),
      req.user!.userId,
      email,
      role,
      branchIds ?? [],
      allBranches ?? false
    );
    created(res, access);
  } catch (err) { next(err); }
};

export const updateMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { role, branchIds, allBranches } = req.body;
    const access = await companyService.updateMember(
      String(req.params.id),
      req.user!.userId,
      String(req.params.userId),
      { role, branchIds, allBranches }
    );
    ok(res, access);
  } catch (err) { next(err); }
};

export const removeMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await companyService.removeMember(
      String(req.params.id),
      req.user!.userId,
      String(req.params.userId)
    );
    ok(res, { removed: true });
  } catch (err) { next(err); }
};
