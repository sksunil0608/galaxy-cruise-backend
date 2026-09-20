const router = require("express").Router()
const ctrl = require("../Controller/VendorController")
const auth = require("../middleware/auth")
const permission = require("../middleware/permission")

router.get("/", auth, permission("vendors.view"), ctrl.list)
router.get("/dashboard", auth, permission("dashboard.view"), ctrl.dashboard)
router.post("/", auth, permission("vendors.create"), ctrl.create)
router.put("/:id", auth, permission("vendors.update"), ctrl.update)
router.delete("/:id", auth, permission("vendors.delete"), ctrl.remove)
router.get("/:slug", auth, permission("vendors.view"), ctrl.single)

module.exports = router
