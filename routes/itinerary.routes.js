const router = require("express").Router()
const ctrl = require("../Controller/ItineraryController")
const auth = require("../middleware/auth")
const permission = require("../middleware/permission")

router.get("/", auth, permission("itinerary.view"), ctrl.listItineraries)
router.post("/", auth, permission("itinerary.manage"), ctrl.createItinerary)
router.put("/:id", auth, permission("itinerary.manage"), ctrl.updateItinerary)
router.delete("/:id", auth, permission("itinerary.manage"), ctrl.removeItinerary)

router.get("/port-aliases", auth, permission("itinerary.view"), ctrl.listPortAliases)
router.post("/port-aliases", auth, permission("itinerary.manage"), ctrl.createPortAlias)
router.put("/port-aliases/:id", auth, permission("itinerary.manage"), ctrl.updatePortAlias)
router.delete("/port-aliases/:id", auth, permission("itinerary.manage"), ctrl.removePortAlias)

module.exports = router
