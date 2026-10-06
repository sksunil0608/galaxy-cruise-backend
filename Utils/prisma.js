require("dotenv").config({ override: true })

const { PrismaClient } = require("@prisma/client")

const dbUrl = process.env.DATABASE_URL

let prisma

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
  })
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      datasources: {
        db: {
          url: dbUrl,
        },
      },
    })
  }
  prisma = global.prisma
}

module.exports = prisma