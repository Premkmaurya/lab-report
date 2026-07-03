const express = require("express");
const auditMiddleware = require("../middlewares/audit.middleware");
const {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} = require("../controllers/department.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authMiddleware.userAuth);

router.get("/", getDepartments);
router.post("/", authMiddleware.authorizeRoles("admin"), auditMiddleware("CREATED", "Department"), createDepartment);
router.patch("/:id", authMiddleware.authorizeRoles("admin"), auditMiddleware("UPDATED", "Department"), updateDepartment);
router.delete("/:id", authMiddleware.authorizeRoles("admin"), auditMiddleware("DELETED", "Department"), deleteDepartment);

module.exports = router;
