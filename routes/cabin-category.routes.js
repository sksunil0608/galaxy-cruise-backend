const router = require("express").Router()
const CabinCategoryController = require("../Controller/CabinCategoryController")
const auth = require("../middleware/auth")
const permission = require("../middleware/permission")

router.get("/", auth, permission("cabin_categories.view"), CabinCategoryController.list)
router.get("/:id", auth, permission("cabin_categories.view"), CabinCategoryController.getOne)
router.post("/", auth, permission("cabin_categories.create"), CabinCategoryController.create)
router.put("/:id", auth, permission("cabin_categories.update"), CabinCategoryController.update)
router.delete("/:id", auth, permission("cabin_categories.delete"), CabinCategoryController.remove)

module.exports = router
