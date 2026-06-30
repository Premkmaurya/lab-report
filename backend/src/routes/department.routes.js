const express = require("express");
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
router.post("/", authMiddleware.authorizeRoles("admin"), createDepartment);
router.patch("/:id", authMiddleware.authorizeRoles("admin"), updateDepartment);
router.delete("/:id", authMiddleware.authorizeRoles("admin"), deleteDepartment);

module.exports = router;
