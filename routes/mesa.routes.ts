import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import * as mc from "../controllers/mesa/mesa.controller";

const router = Router({ mergeParams: true });
router.use(authMiddleware);

// Mesas
router.get( "/",                    mc.listar);
router.post("/",                    mc.crear);
router.post("/init",                mc.inicializar);
router.put(    "/:mesaId/mesero",      mc.asignarMesero);
router.put(    "/:mesaId/liberar",     mc.liberar);
router.delete( "/:mesaId",            mc.eliminar);

// Pedido activo de la mesa
router.get( "/:mesaId/pedido",      mc.getPedido);
router.put( "/:mesaId/pedido",      mc.guardarPedido);

// Facturar mesa
router.post("/:mesaId/facturar",    mc.facturar);

export default router;
