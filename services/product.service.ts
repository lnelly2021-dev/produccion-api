import Product from "../models/Product";
import UserCompanyAccess from "../models/UserCompanyAccess";
import { NotFoundError, ForbiddenError } from "../utils/errors";

async function assertBranchAccess(branchId: string, userId: string) {
  const access = await UserCompanyAccess.findOne({
    user:     userId,
    branches: branchId,
    active:   true,
  });
  if (!access) throw new ForbiddenError("Access denied to this branch");
  return access;
}

export async function findByBranch(branchId: string, userId: string) {
  await assertBranchAccess(branchId, userId);
  return Product.find({ branch: branchId, active: true })
    .sort({ categoria: 1, nombre: 1 })
    .lean();
}

export async function create(branchId: string, userId: string, dto: any) {
  await assertBranchAccess(branchId, userId);
  return Product.create({ ...dto, branch: branchId });
}

export async function update(
  productId: string,
  branchId: string,
  userId: string,
  dto: any
) {
  await assertBranchAccess(branchId, userId);
  const product = await Product.findOneAndUpdate(
    { _id: productId, branch: branchId, active: true },
    dto,
    { new: true, runValidators: true }
  );
  if (!product) throw new NotFoundError("Product not found");
  return product;
}

export async function updateStock(
  productId: string,
  branchId: string,
  userId: string,
  delta: number
) {
  await assertBranchAccess(branchId, userId);
  const product = await Product.findOneAndUpdate(
    { _id: productId, branch: branchId, active: true },
    { $inc: { stock: delta } },
    { new: true }
  );
  if (!product) throw new NotFoundError("Product not found");
  return product;
}

export async function remove(
  productId: string,
  branchId: string,
  userId: string
) {
  await assertBranchAccess(branchId, userId);
  const product = await Product.findOneAndUpdate(
    { _id: productId, branch: branchId, active: true },
    { active: false },
    { new: true }
  );
  if (!product) throw new NotFoundError("Product not found");
}
