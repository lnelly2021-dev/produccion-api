import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import * as vc from "../controllers/venta/venta.controller";

const router = Router({ mergeParams: true });
router.use(authMiddleware);

router.get( "/",            vc.listar);
router.post("/",            vc.crear);
router.put( "/:ventaId/anular", vc.anular);

export default router;
