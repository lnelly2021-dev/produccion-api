import { Router } from "express";
import * as exampleController from "../controllers/example/example.controller";
import { validateFields } from "../middlewares/validateFields";
// import { authMiddleware } from "../middlewares/auth.middleware"; // descomentar si se requiere autenticación

const router = Router();

router.get("/", exampleController.list);
router.get("/:id", exampleController.getById);
router.post("/", validateFields(["name"]), exampleController.create);
router.put("/:id", exampleController.update);
router.delete("/:id", exampleController.remove);

export default router;
