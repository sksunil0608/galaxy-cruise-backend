require("dotenv").config()

const express = require("express")
const env = process.env

const authRoutes = require("./routes/auth.routes")
const cruiseRoutes = require("./routes/cruise.routes")

const app = express()

// --- Global headers (CORS disabled by allowing everything) ---
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization")

  if (req.method === "OPTIONS") {
    return res.sendStatus(200)
  }

  next()
})

app.use(express.json({
  limit: "15mb"
}))
app.use(express.urlencoded({
  extended: true,
  limit: "15mb"
}))

app.use("/api/cruises", cruiseRoutes)
app.use("/api/ships", require("./routes/ship.routes"))
app.use("/api/cabin-categories", require("./routes/cabin-category.routes"))
app.use("/api/auth", authRoutes)
app.use("/api/users", require("./routes/user.routes"))
app.use("/api/roles", require("./routes/role.routes"))
app.use("/api/permissions", require("./routes/permission.routes"))
app.use("/api/vendors", require("./routes/vendor"))
app.use("/api/vendor-runs", require("./routes/vendor-run.routes"))
app.use("/api/activities", require("./routes/activity.routes"))
app.use("/api/itinerary", require("./routes/itinerary.routes"))
app.use("/api/settings", require("./routes/settings.routes"))

const PORT = env.PORT || 8000
const VERSION = "0.0.5"

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Cruise Saga API is running",
    version: VERSION,
    env: process.env.NODE_ENV || "development"
  })
})

app.use((err, req, res, next) => {
  if (!err) {
    return next()
  }

  console.error("[API ERROR]", err)

  const statusCode = err.status || err.statusCode || (err.type === "entity.too.large" ? 413 : 500)

  res.status(statusCode).json({
    success: false,
    error: err.message || "Server error"
  })
})

console.log("DATABASE_URL:", process.env.DATABASE_URL);
app.listen(PORT, () => {
  console.log(`[SERVER] Running on port ${PORT} | Version ${VERSION} | Env: ${process.env.NODE_ENV || "development"}`)
})
