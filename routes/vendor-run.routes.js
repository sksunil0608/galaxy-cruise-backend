const express = require("express")
const router = express.Router()

const VendorRunController = require("../Controller/VendorRunController")
const auth = require("../middleware/auth")
const permission = require("../middleware/permission")

router.get("/", auth, permission("vendor_runs.view"), VendorRunController.list)
router.get("/:id", auth, permission("vendor_runs.view"), VendorRunController.getOne)
router.post("/", auth, permission("vendor_runs.create"), VendorRunController.create)
router.put("/:id", auth, permission("vendor_runs.update"), VendorRunController.update)
router.delete("/:id", auth, permission("vendor_runs.delete"), VendorRunController.remove)

module.exports = router
