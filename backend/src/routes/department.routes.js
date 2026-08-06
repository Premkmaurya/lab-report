const express = require("express");
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

router.get("/", cacheMiddleware(300), getDepartments);
router.post("/", injectTenantOnCreate, authMiddleware.authorizePermissions("manage_tests"), createDepartment);
router.patch("/:id", authMiddleware.authorizePermissions("manage_tests"), updateDepartment);
router.delete("/:id", authMiddleware.authorizeRoles("admin"), deleteDepartment);

module.exports = router;
