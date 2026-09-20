const express = require("express")
const router = express.Router()

const PermissionController = require("../Controller/PermissionController")

router.get("/",PermissionController.getPermissions)
router.post("/",PermissionController.createPermission)
router.put("/:id",PermissionController.updatePermission)
router.delete("/:id",PermissionController.deletePermission)

module.exports = router