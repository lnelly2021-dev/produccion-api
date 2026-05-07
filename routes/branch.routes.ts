import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  validateCreateBranch,
  validateUpdateBranch,
} from "../validators/branch.validator";
import * as branchController from "../controllers/branch/branch.controller";

const router = Router();

router.use(authMiddleware);

router.post("/:companyId/branches", validateCreateBranch, branchController.create);
router.get("/:companyId/branches", branchController.list);
router.get("/:companyId/branches/:branchId", branchController.getById);
router.put("/:companyId/branches/:branchId", validateUpdateBranch, branchController.update);
router.delete("/:companyId/branches/:branchId", branchController.remove);

export default router;
