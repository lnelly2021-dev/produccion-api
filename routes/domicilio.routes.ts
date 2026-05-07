import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import * as dc from "../controllers/domicilio/domicilio.controller";

const router = Router({ mergeParams: true });
router.use(authMiddleware);

router.get( "/",                  dc.listar);
router.post("/",                  dc.crear);
router.put( "/:domId/estado",     dc.avanzarEstado);
router.put( "/:domId/cancelar",   dc.cancelar);

export default router;
