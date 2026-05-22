import { Router, Request, Response, NextFunction } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import * as productController from "../controllers/product/product.controller";
import Product from "../models/Product";
import { assertBranchAccess } from "../utils/tenant.guard";
import { ok } from "../utils/response.util";

const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.get(   "/",              productController.list);
router.post(  "/",              productController.create);
router.put(   "/:productId",    productController.update);
router.patch( "/:productId/stock", productController.updateStock);
router.delete("/:productId",    productController.remove);

// Restaurar productos eliminados (active:false → active:true)
router.post("/restore-inactive", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branchId = req.params.branchId;
    await assertBranchAccess(branchId, (req as any).user.userId);
    const inactivos = await Product.countDocuments({ branch: branchId, active: false });
    const result    = await Product.updateMany({ branch: branchId, active: false }, { $set: { active: true } });
    ok(res, { reactivados: result.modifiedCount, inactivosEncontrados: inactivos });
  } catch (err) { next(err); }
});

export default router;
