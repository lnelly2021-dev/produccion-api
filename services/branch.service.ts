import Branch from "../models/Branch";
import UserCompanyAccess from "../models/UserCompanyAccess";
import { NotFoundError, ForbiddenError } from "../utils/errors";
import type { CreateBranchDto, UpdateBranchDto } from "../validators/branch.validator";

async function assertCompanyAccess(companyId: string, userId: string) {
  const access = await UserCompanyAccess.findOne({
    user: userId,
    company: companyId,
    active: true,
  });
  if (!access) throw new ForbiddenError("Access denied to this company");
  return access;
}

export async function create(
  companyId: string,
  userId: string,
  dto: CreateBranchDto
) {
  const access = await assertCompanyAccess(companyId, userId);
  if (!["admin", "manager"].includes(access.role)) {
    throw new ForbiddenError("Insufficient permissions to create branches");
  }

  const branch = await Branch.create({ ...dto, company: companyId });

  await UserCompanyAccess.updateOne(
    { user: userId, company: companyId },
    { $addToSet: { branches: branch._id } }
  );

  return branch;
}

export async function findByCompany(companyId: string, userId: string) {
  await assertCompanyAccess(companyId, userId);
  return Branch.find({ company: companyId, active: true }).lean();
}

export async function findById(branchId: string, companyId: string, userId: string) {
  await assertCompanyAccess(companyId, userId);
  const branch = await Branch.findOne({ _id: branchId, company: companyId, active: true });
  if (!branch) throw new NotFoundError("Branch not found");
  return branch;
}

export async function update(
  branchId: string,
  companyId: string,
  userId: string,
  dto: UpdateBranchDto
) {
  const access = await assertCompanyAccess(companyId, userId);
  if (!["admin", "manager"].includes(access.role)) {
    throw new ForbiddenError("Insufficient permissions to update branches");
  }

  const branch = await Branch.findOneAndUpdate(
    { _id: branchId, company: companyId, active: true },
    dto,
    { new: true, runValidators: true }
  );

  if (!branch) throw new NotFoundError("Branch not found");
  return branch;
}

export async function softDelete(
  branchId: string,
  companyId: string,
  userId: string
) {
  const access = await assertCompanyAccess(companyId, userId);
  if (access.role !== "admin") {
    throw new ForbiddenError("Only admins can delete branches");
  }

  const branch = await Branch.findOneAndUpdate(
    { _id: branchId, company: companyId, active: true },
    { active: false },
    { new: true }
  );

  if (!branch) throw new NotFoundError("Branch not found");

  // Limpiar la referencia en UserCompanyAccess para que /auth/me no la devuelva
  await UserCompanyAccess.updateMany(
    { company: companyId },
    { $pull: { branches: branch._id } }
  );
}
