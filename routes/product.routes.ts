import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import * as productController from "../controllers/product/product.controller";

const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.get(   "/",              productController.list);
router.post(  "/",              productController.create);
router.put(   "/:productId",    productController.update);
router.patch( "/:productId/stock", productController.updateStock);
router.delete("/:productId",    productController.remove);

export default router;
