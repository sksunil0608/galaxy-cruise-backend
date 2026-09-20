const express = require("express")
const router = express.Router()

const RoleController = require("../Controller/RoleController")

router.get("/",RoleController.getRoles)
router.post("/",RoleController.createRole)
router.put("/:id",RoleController.updateRole)
router.delete("/:id",RoleController.deleteRole)

router.post("/assign-permission",RoleController.assignPermission)

module.exports = router