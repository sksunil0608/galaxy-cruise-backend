require("dotenv").config()

const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcrypt")

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

const SHIP_DETAILS = {
  CJ: {
    name: "Celestyal Journey",
    image: "https://images.unsplash.com/photo-1548574505-5e239809ee19?w=900&q=80",
    cabins: 680,
    restaurants: 5,
    bars: 9,
    pools: 1,
    jacuzzis: 2,
    guests: 1360,
    crew: 470,
    balconyCabins: 60,
    suites: 34,
    spa: "Sozo Spa"
  },
  CD: {
    name: "Celestyal Discovery",
    image: "https://images.unsplash.com/photo-1599640842225-85d111c60e6b?w=900&q=80",
    cabins: 600,
    restaurants: 4,
    bars: 7,
    pools: 1,
    jacuzzis: 2,
    guests: 1200,
    crew: 420,
    balconyCabins: 50,
    suites: 28,
    spa: "Aqua Spa"
  }
}

const CRUISE_DATA = [
  {
    id: "CJ07260418",
    ship: "Celestyal Journey",
    shipCode: "CJ",
    package: "Heavenly Greece, Italy and Croatia - 7Nights",
    portFrom: "PIR",
    portTo: "PIR",
    routeLabel: "Piraeus → Piraeus",
    nights: 7,
    startDate: "2026-04-18T13:00:00",
    endDate: "2026-04-25T07:00:00",
    seatsAvailable: 685,
    totalCapacity: 1360,
    totalCabins: 680,
    trend: "up",
    confidence: "High",
    pinned: false,
    vendor: { name: "Celestyal Cruises" },
    currency: "GBP",
    promotions: ["PUBLISHED Wave Campaign B", "Celestyal One"],
    cabinCategories: [
      {
        code: "IA",
        name: "Interior Stateroom",
        type: "Interior",
        status: "Available",
        avlResult: "OK",
        total: 10,
        avail: 5,
        cabinPrice: 1338,
        perPersonPrice: 669,
        voyageFare: 410,
        portCharges: 259,
        capacity: 4,
        childBeds: 1,
        promos: ["PUBLISHED Wave Campaign B", "Celestyal One"],
        trend: "stable",
        range7d: "5–8",
        confidence: "High"
      },
      {
        code: "IB",
        name: "Interior Stateroom",
        type: "Interior",
        status: "Waitlist",
        avlResult: "WTL",
        total: 10,
        avail: 0,
        cabinPrice: 1458,
        perPersonPrice: 729,
        voyageFare: 470,
        portCharges: 259,
        capacity: 4,
        childBeds: 1,
        promos: ["PUBLISHED Wave Campaign B", "Celestyal One"],
        trend: "down",
        range7d: "0–2",
        confidence: "Medium"
      },
      {
        code: "IC",
        name: "Interior Stateroom",
        type: "Interior",
        status: "Waitlist",
        avlResult: "WTL",
        total: 10,
        avail: 0,
        cabinPrice: 1578,
        perPersonPrice: 789,
        voyageFare: 530,
        portCharges: 259,
        capacity: 4,
        childBeds: 0,
        promos: ["PUBLISHED Wave Campaign B", "Celestyal One"],
        trend: "down",
        range7d: "0–1",
        confidence: "Medium"
      },
      {
        code: "XBO",
        name: "Exterior Stateroom (Obstructed View)",
        type: "Exterior",
        status: "Available",
        avlResult: "OK",
        total: 10,
        avail: 1,
        cabinPrice: 1618,
        perPersonPrice: 809,
        voyageFare: 550,
        portCharges: 259,
        capacity: 2,
        childBeds: 0,
        promos: ["PUBLISHED Wave Campaign B", "Celestyal One"],
        trend: "down",
        range7d: "1–4",
        confidence: "Low"
      },
      {
        code: "XA",
        name: "Exterior Stateroom",
        type: "Exterior",
        status: "Available",
        avlResult: "OK",
        total: 10,
        avail: 9,
        cabinPrice: 1618,
        perPersonPrice: 809,
        voyageFare: 550,
        portCharges: 259,
        capacity: 4,
        childBeds: 0,
        promos: ["PUBLISHED Wave Campaign B", "Celestyal One"],
        trend: "stable",
        range7d: "8–10",
        confidence: "High"
      },
      {
        code: "XB",
        name: "Exterior Stateroom",
        type: "Exterior",
        status: "Available",
        avlResult: "OK",
        total: 10,
        avail: 10,
        cabinPrice: 1678,
        perPersonPrice: 839,
        voyageFare: 580,
        portCharges: 259,
        capacity: 4,
        childBeds: 1,
        promos: ["PUBLISHED Wave Campaign B", "Celestyal One"],
        trend: "up",
        range7d: "9–10",
        confidence: "High"
      },
      {
        code: "XC",
        name: "Exterior Stateroom",
        type: "Exterior",
        status: "Available",
        avlResult: "OK",
        total: 10,
        avail: 10,
        cabinPrice: 1798,
        perPersonPrice: 899,
        voyageFare: 640,
        portCharges: 259,
        capacity: 4,
        childBeds: 0,
        promos: ["PUBLISHED Wave Campaign B", "Celestyal One"],
        trend: "stable",
        range7d: "10–10",
        confidence: "High"
      },
      {
        code: "XD",
        name: "Exterior Stateroom",
        type: "Exterior",
        status: "Available",
        avlResult: "OK",
        total: 10,
        avail: 10,
        cabinPrice: 1918,
        perPersonPrice: 959,
        voyageFare: 700,
        portCharges: 259,
        capacity: 4,
        childBeds: 0,
        promos: ["PUBLISHED Wave Campaign B", "Celestyal One"],
        trend: "up",
        range7d: "9–10",
        confidence: "High"
      },
      {
        code: "SJA",
        name: "Junior Balcony Suite",
        type: "Suite",
        status: "Waitlist",
        avlResult: "WTL",
        total: 10,
        avail: 0,
        cabinPrice: 2838,
        perPersonPrice: 1419,
        voyageFare: 1160,
        portCharges: 259,
        capacity: 3,
        childBeds: 0,
        promos: ["PUBLISHED Wave Campaign B", "Celestyal One"],
        trend: "down",
        range7d: "0–3",
        confidence: "Low"
      },
      {
        code: "SJB",
        name: "Junior Balcony Suite",
        type: "Suite",
        status: "Available",
        avlResult: "OK",
        total: 10,
        avail: 10,
        cabinPrice: 3098,
        perPersonPrice: 1549,
        voyageFare: 1290,
        portCharges: 259,
        capacity: 3,
        childBeds: 0,
        promos: ["PUBLISHED Wave Campaign B", "Celestyal One"],
        trend: "up",
        range7d: "7–10",
        confidence: "High"
      },
      {
        code: "SJC",
        name: "Junior Balcony Suite",
        type: "Suite",
        status: "Available",
        avlResult: "OK",
        total: 10,
        avail: 10,
        cabinPrice: 3358,
        perPersonPrice: 1679,
        voyageFare: 1420,
        portCharges: 259,
        capacity: 3,
        childBeds: 0,
        promos: ["PUBLISHED Wave Campaign B", "Celestyal One"],
        trend: "stable",
        range7d: "9–10",
        confidence: "High"
      },
      {
        code: "SG",
        name: "Grand Suite",
        type: "Suite",
        status: "Available",
        avlResult: "OK",
        total: 10,
        avail: 8,
        cabinPrice: 4098,
        perPersonPrice: 2049,
        voyageFare: 1790,
        portCharges: 259,
        capacity: 4,
        childBeds: 0,
        promos: ["PUBLISHED Wave Campaign B", "Celestyal One"],
        trend: "stable",
        range7d: "7–9",
        confidence: "High"
      },
      {
        code: "SP",
        name: "Stargazer Suite",
        type: "Suite",
        status: "Waitlist",
        avlResult: "WTL",
        total: 1,
        avail: 0,
        cabinPrice: 4898,
        perPersonPrice: 2449,
        voyageFare: 2190,
        portCharges: 259,
        capacity: 4,
        childBeds: 0,
        promos: ["PUBLISHED Wave Campaign B", "Celestyal One"],
        trend: "down",
        range7d: "0–1",
        confidence: "Low"
      }
    ]
  },
  {
    id: "CD03260410",
    ship: "Celestyal Discovery",
    shipCode: "CD",
    package: "Iconic Greek Islands - 3Nights",
    portFrom: "LAV",
    portTo: "LAV",
    routeLabel: "Lavrion → Lavrion",
    nights: 3,
    startDate: "2026-04-10T13:00:00",
    endDate: "2026-04-13T06:00:00",
    seatsAvailable: 420,
    totalCapacity: 1200,
    totalCabins: 600,
    trend: "down",
    confidence: "Medium",
    pinned: false,
    vendor: { name: "Celestyal Cruises" },
    currency: "GBP",
    promotions: ["PUBLISHED Wave Campaign B", "Celestyal One"],
    cabinCategories: [
      {
        code: "IA",
        name: "Interior Stateroom",
        type: "Interior",
        status: "Available",
        avlResult: "OK",
        total: 20,
        avail: 12,
        cabinPrice: 598,
        perPersonPrice: 299,
        voyageFare: 180,
        portCharges: 119,
        capacity: 4,
        childBeds: 1,
        promos: ["PUBLISHED Wave Campaign B"],
        trend: "up",
        range7d: "10–15",
        confidence: "High"
      },
      {
        code: "XA",
        name: "Exterior Stateroom",
        type: "Exterior",
        status: "Available",
        avlResult: "OK",
        total: 15,
        avail: 8,
        cabinPrice: 758,
        perPersonPrice: 379,
        voyageFare: 260,
        portCharges: 119,
        capacity: 4,
        childBeds: 0,
        promos: ["PUBLISHED Wave Campaign B"],
        trend: "stable",
        range7d: "7–10",
        confidence: "Medium"
      },
      {
        code: "SJB",
        name: "Junior Balcony Suite",
        type: "Suite",
        status: "Available",
        avlResult: "OK",
        total: 5,
        avail: 3,
        cabinPrice: 1158,
        perPersonPrice: 579,
        voyageFare: 460,
        portCharges: 119,
        capacity: 3,
        childBeds: 0,
        promos: ["PUBLISHED Wave Campaign B"],
        trend: "down",
        range7d: "2–5",
        confidence: "Medium"
      }
    ]
  }
]

async function ensureRole(name) {
  const existing = await prisma.role.findFirst({
    where: { name }
  })

  if (existing) {
    return existing
  }

  return prisma.role.create({
    data: { name }
  })
}

async function ensureVendor(vendorId) {
  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId }
  })

  if (!vendor) {
    throw new Error(`Vendor ${vendorId} not found`)
  }

  return vendor
}

async function ensureShip(cruise, vendorId) {
  const shipCode = cruise.shipCode || cruise.ship
  const shipDetails = SHIP_DETAILS[shipCode] || {}

  return prisma.ship.upsert({
    where: { code: shipCode },
    update: {
      name: cruise.ship,
      vendorId,
      image: shipDetails.image ?? null,
      cabins: shipDetails.cabins ?? cruise.totalCabins ?? null,
      restaurants: shipDetails.restaurants ?? null,
      bars: shipDetails.bars ?? null,
      pools: shipDetails.pools ?? null,
      jacuzzis: shipDetails.jacuzzis ?? null,
      guests: shipDetails.guests ?? cruise.totalCapacity ?? null,
      crew: shipDetails.crew ?? null,
      balconyCabins: shipDetails.balconyCabins ?? null,
      suites: shipDetails.suites ?? null,
      spa: shipDetails.spa ?? null
    },
    create: {
      code: shipCode,
      name: cruise.ship,
      vendorId,
      image: shipDetails.image ?? null,
      cabins: shipDetails.cabins ?? cruise.totalCabins ?? null,
      restaurants: shipDetails.restaurants ?? null,
      bars: shipDetails.bars ?? null,
      pools: shipDetails.pools ?? null,
      jacuzzis: shipDetails.jacuzzis ?? null,
      guests: shipDetails.guests ?? cruise.totalCapacity ?? null,
      crew: shipDetails.crew ?? null,
      balconyCabins: shipDetails.balconyCabins ?? null,
      suites: shipDetails.suites ?? null,
      spa: shipDetails.spa ?? null
    }
  })
}

function buildCruisePayload(cruise, vendorId, shipId) {
  return {
    code: cruise.id,
    vendorId,
    shipId,
    ship: cruise.ship,
    shipCode: cruise.shipCode,
    package: cruise.package,
    routeLabel: cruise.routeLabel,
    portFrom: cruise.portFrom,
    portTo: cruise.portTo,
    nights: cruise.nights,
    startDate: new Date(cruise.startDate),
    endDate: new Date(cruise.endDate),
    seatsAvailable: cruise.seatsAvailable,
    totalCapacity: cruise.totalCapacity,
    totalCabins: cruise.totalCabins,
    trend: cruise.trend,
    confidence: cruise.confidence,
    pinned: cruise.pinned,
    currency: cruise.currency,
    rawPayload: cruise
  }
}

function buildCabinCategoryCreateInput(cabin) {
  return {
    code: cabin.code,
    name: cabin.name,
    type: cabin.type,
    status: cabin.status,
    avlResult: cabin.avlResult,
    total: cabin.total,
    available: cabin.avail,
    cabinPrice: cabin.cabinPrice,
    perPersonPrice: cabin.perPersonPrice,
    voyageFare: cabin.voyageFare,
    portCharges: cabin.portCharges,
    capacity: cabin.capacity,
    childBeds: cabin.childBeds,
    trend: cabin.trend,
    range7d: cabin.range7d,
    confidence: cabin.confidence,
    promotions: {
      create: cabin.promos.map(name => ({ name }))
    }
  }
}

async function seedCruiseData(vendorId) {
  await ensureVendor(vendorId)

  for (const cruise of CRUISE_DATA) {
    const ship = await ensureShip(cruise, vendorId)
    const existingCruise = await prisma.cruise.findFirst({
      where: { code: cruise.id },
      include: {
        cabinCategories: {
          select: { id: true }
        }
      }
    })

    if (existingCruise) {
      const cabinCategoryIds = existingCruise.cabinCategories.map(category => category.id)

      if (cabinCategoryIds.length > 0) {
        await prisma.cabinPromotion.deleteMany({
          where: {
            cabinCategoryId: {
              in: cabinCategoryIds
            }
          }
        })
      }

      await prisma.cabinCategory.deleteMany({
        where: { cruiseId: existingCruise.id }
      })

      await prisma.cruisePromotion.deleteMany({
        where: { cruiseId: existingCruise.id }
      })

      await prisma.cruise.update({
        where: { id: existingCruise.id },
        data: {
          ...buildCruisePayload(cruise, vendorId, ship.id),
          promotions: {
            create: cruise.promotions.map(name => ({ name }))
          },
          cabinCategories: {
            create: cruise.cabinCategories.map(buildCabinCategoryCreateInput)
          }
        }
      })
    } else {
      await prisma.cruise.create({
        data: {
          ...buildCruisePayload(cruise, vendorId, ship.id),
          promotions: {
            create: cruise.promotions.map(name => ({ name }))
          },
          cabinCategories: {
            create: cruise.cabinCategories.map(buildCabinCategoryCreateInput)
          }
        }
      })
    }
  }
}

function daysAgo(days, hour = 4, minute = 0) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  date.setHours(hour, minute, 0, 0)
  return date
}

async function seedVendorRuns(vendorId) {
  const cruiseCount = await prisma.cruise.count({
    where: { vendorId }
  })

  const shipCount = await prisma.ship.count({
    where: { vendorId }
  })

  const cabinCategoryCount = await prisma.cabinCategory.count({
    where: {
      cruise: {
        vendorId
      }
    }
  })

  const runTemplates = [
    { days: 42, durationMs: 7420, healthScore: 87, errorCount: 1, status: "SUCCESS" },
    { days: 28, durationMs: 7095, healthScore: 90, errorCount: 0, status: "SUCCESS" },
    { days: 21, durationMs: 6880, healthScore: 92, errorCount: 0, status: "SUCCESS" },
    { days: 14, durationMs: 7210, healthScore: 86, errorCount: 1, status: "WARNING" },
    { days: 7, durationMs: 6740, healthScore: 94, errorCount: 0, status: "SUCCESS" },
    { days: 1, durationMs: 6515, healthScore: 96, errorCount: 0, status: "SUCCESS" }
  ]

  await prisma.vendorRun.deleteMany({
    where: { vendorId }
  })

  await prisma.vendorRun.createMany({
    data: runTemplates.map(run => {
      const startedAt = daysAgo(run.days, 4, 30)
      const finishedAt = new Date(startedAt.getTime() + run.durationMs)

      return {
        vendorId,
        status: run.status,
        healthScore: run.healthScore,
        responseTimeMs: run.durationMs,
        startedAt,
        finishedAt,
        cruisesSeen: cruiseCount,
        shipsSeen: shipCount,
        cabinCategoriesSeen: cabinCategoryCount,
        errorCount: run.errorCount,
        notes: "Seeded extraction run"
      }
    })
  })
}

async function main() {
  const password = await bcrypt.hash("root", 10)

  const permissions = [
    { key: "dashboard.view", name: "View Dashboard" },
    { key: "users.view", name: "View Users" },
    { key: "users.create", name: "Create Users" },
    { key: "users.update", name: "Update Users" },
    { key: "users.delete", name: "Delete Users" },
    { key: "roles.view", name: "View Roles" },
    { key: "roles.create", name: "Create Roles" },
    { key: "cruises.view", name: "View Cruises" },
    { key: "cruises.create", name: "Create Cruises" },
    { key: "cruises.update", name: "Update Cruises" },
    { key: "cruises.delete", name: "Delete Cruises" },
    { key: "ships.view", name: "View Ships" },
    { key: "ships.create", name: "Create Ships" },
    { key: "ships.update", name: "Update Ships" },
    { key: "ships.delete", name: "Delete Ships" },
    { key: "vendors.view", name: "View Vendors" },
    { key: "vendors.create", name: "Create Vendors" },
    { key: "vendors.update", name: "Update Vendors" },
    { key: "vendors.delete", name: "Delete Vendors" },
    { key: "vendor_runs.view", name: "View Vendor Runs" },
    { key: "vendor_runs.create", name: "Create Vendor Runs" },
    { key: "vendor_runs.update", name: "Update Vendor Runs" },
    { key: "vendor_runs.delete", name: "Delete Vendor Runs" },
    { key: "cabin_categories.view", name: "View Cabin Categories" },
    { key: "cabin_categories.create", name: "Create Cabin Categories" },
    { key: "cabin_categories.update", name: "Update Cabin Categories" },
    { key: "cabin_categories.delete", name: "Delete Cabin Categories" },
    { key: "bookings.view", name: "View Bookings" },
    { key: "bookings.create", name: "Create Bookings" },
    { key: "itinerary.view", name: "View Itinerary Reference Data" },
    { key: "itinerary.manage", name: "Manage Itinerary Reference Data" },
    { key: "settings.manage", name: "Manage App Settings" }
  ]

  await prisma.permission.createMany({
    data: permissions,
    skipDuplicates: true
  })

  const adminRole = await ensureRole("Admin")
  await ensureRole("Manager")
  await ensureRole("User")

  const adminPermissions = await prisma.permission.findMany()

  for (const permission of adminPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id
        }
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id
      }
    })
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: "admin@cruisesaga.com" }
  })

  if (existingUser) {
    await prisma.user.update({
      where: { email: "admin@cruisesaga.com" },
      data: {
        name: "Admin User",
        password,
        roleId: adminRole.id
      }
    })
  } else {
    await prisma.user.create({
      data: {
        name: "Admin User",
        email: "admin@cruisesaga.com",
        password,
        roleId: adminRole.id
      }
    })
  }

  await seedCruiseData(1)
  await seedVendorRuns(1)

  console.log("Seed completed: admin@cruisesaga.com / root")
  console.log("Cruise seed completed for vendor id 1")
  console.log("Vendor run seed completed for vendor id 1")
}

main()
  .catch(error => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
