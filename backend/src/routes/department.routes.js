const express = require("express");
const auditMiddleware = require("../middlewares/audit.middleware");
const {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} = require("../controllers/department.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const cacheMiddleware = require("../middlewares/cache.middleware");

const { injectTenantFilter, injectTenantOnCreate } = require("../middlewares/tenant.middleware");

const router = express.Router();

router.use(authMiddleware.userAuth, injectTenantFilter);

router.get("/", cacheMiddleware(86400, () => "departments:all"), getDepartments);
router.post("/", injectTenantOnCreate, authMiddleware.authorizePermissions("manage_tests"), auditMiddleware("CREATED", "Department"), createDepartment);
router.patch("/:id", authMiddleware.authorizePermissions("manage_tests"), auditMiddleware("UPDATED", "Department"), updateDepartment);
router.delete("/:id", authMiddleware.authorizeRoles("admin"), auditMiddleware("DELETED", "Department"), deleteDepartment);

module.exports = router;
