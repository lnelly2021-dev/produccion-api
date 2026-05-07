import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validateCreateCompany, validateUpdateCompany } from "../validators/company.validator";
import * as companyController from "../controllers/company/company.controller";

const router = Router();
router.use(authMiddleware);

// Company CRUD
router.post("/", validateCreateCompany, companyController.create);
router.get("/", companyController.list);
router.get("/:id", companyController.getById);
router.put("/:id", validateUpdateCompany, companyController.update);
router.delete("/:id", companyController.remove);

// Members
router.get("/:id/members", companyController.listMembers);
router.post("/:id/members", companyController.addMember);
router.put("/:id/members/:userId", companyController.updateMember);
router.delete("/:id/members/:userId", companyController.removeMember);

export default router;
