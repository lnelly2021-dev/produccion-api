import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import * as rc from "../controllers/reporte/reporte.controller";

const router = Router({ mergeParams: true });
router.use(authMiddleware);

router.get("/impuestos", rc.impuestos);

export default router;
