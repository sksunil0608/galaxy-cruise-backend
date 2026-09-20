const prisma = require("../Utils/prisma")
const {
  parsePagination,
  buildPaginationMeta
} = require("../Utils/pagination")

function formatCoverageMonths(totalMonths) {
  if (!totalMonths || totalMonths <= 0) {
    return "No coverage"
  }

  const years = Math.floor(totalMonths / 12)
  const months = totalMonths % 12
  const parts = []

  if (years > 0) {
    parts.push(`${years} year${years === 1 ? "" : "s"}`)
  }

  if (months > 0) {
    parts.push(`${months} month${months === 1 ? "" : "s"}`)
  }

  return parts.join(" ") || "1 month"
}

function getCoverageMonths(cruises = []) {
  const datedCruises = cruises.filter(
    cruise => cruise.startDate instanceof Date && cruise.endDate instanceof Date
  )

  if (datedCruises.length === 0) {
    return 0
  }

  const minStart = new Date(
    Math.min(...datedCruises.map(cruise => cruise.startDate.getTime()))
  )
  const maxEnd = new Date(
    Math.max(...datedCruises.map(cruise => cruise.endDate.getTime()))
  )

  const rawMonths =
    (maxEnd.getFullYear() - minStart.getFullYear()) * 12 +
    (maxEnd.getMonth() - minStart.getMonth()) +
    1

  return Math.max(1, rawMonths)
}

function getHealthLabel(score) {
  if (score >= 85) {
    return "Healthy"
  }

  if (score >= 65) {
    return "Attention"
  }

  return "Critical"
}

function getCoverageWindow(cruises = []) {
  const datedCruises = cruises.filter(
    cruise => cruise.startDate instanceof Date && cruise.endDate instanceof Date
  )

  if (datedCruises.length === 0) {
    return {
      start: null,
      end: null
    }
  }

  return {
    start: new Date(
      Math.min(...datedCruises.map(cruise => cruise.startDate.getTime()))
    ),
    end: new Date(
      Math.max(...datedCruises.map(cruise => cruise.endDate.getTime()))
    )
  }
}

async function getCabinCategoryCountsByVendor() {
  const cruises = await prisma.cruise.findMany({
    select: {
      vendorId: true,
      _count: {
        select: {
          cabinCategories: true
        }
      }
    }
  })

  return cruises.reduce((acc, cruise) => {
    acc[cruise.vendorId] = (acc[cruise.vendorId] ?? 0) + cruise._count.cabinCategories
    return acc
  }, {})
}

async function buildVendorMetrics() {
  const [vendors, cabinCategoryCountByVendor, responseTimeAggregate, totalRuns] =
    await Promise.all([
      prisma.vendor.findMany({
        include: {
          cruises: {
            select: {
              startDate: true,
              endDate: true
            }
          },
          _count: {
            select: {
              cruises: true,
              ships: true,
              runs: true
            }
          },
          runs: {
            orderBy: {
              finishedAt: "desc"
            },
            take: 1
          }
        },
        orderBy: {
          name: "asc"
        }
      }),
      getCabinCategoryCountsByVendor(),
      prisma.vendorRun.aggregate({
        _avg: {
          responseTimeMs: true
        }
      }),
      prisma.vendorRun.count()
    ])

    const vendorFleet = vendors.map(vendor => {
      const latestRun = vendor.runs[0] ?? null
      const coverageMonths = getCoverageMonths(vendor.cruises)
      const coverageWindow = getCoverageWindow(vendor.cruises)
      const healthScore = latestRun?.healthScore ?? 0

      return {
      vendor_id: vendor.id,
      vendor_name: vendor.name,
      slug: vendor.slug,
      url: vendor.url,
      health_score: healthScore,
      health_label: getHealthLabel(healthScore),
      last_status: latestRun?.status ?? "NO_RUNS",
      last_updated_at: latestRun?.finishedAt ?? null,
      total_runs: vendor._count.runs,
      average_response_time_ms: latestRun?.responseTimeMs ?? null,
      error_count: latestRun?.errorCount ?? 0,
      cruise_count: vendor._count.cruises,
        ship_count: vendor._count.ships,
        cabin_category_count: cabinCategoryCountByVendor[vendor.id] ?? 0,
        coverage_months: coverageMonths,
        coverage_label: formatCoverageMonths(coverageMonths),
        coverage_start: coverageWindow.start,
        coverage_end: coverageWindow.end
      }
    })

  const activeVendors = vendorFleet.filter(
    vendor => vendor.total_runs > 0 || vendor.cruise_count > 0
  )

  const fleetHealthScore =
    activeVendors.length > 0
      ? Math.round(
          activeVendors.reduce((sum, vendor) => sum + vendor.health_score, 0) /
            activeVendors.length
        )
      : 0

  return {
    overview: {
      active_vendors: activeVendors.length,
      fleet_health_score: fleetHealthScore,
      fleet_health_label: getHealthLabel(fleetHealthScore),
      total_runs: totalRuns,
      average_response_time_ms: Math.round(
        responseTimeAggregate._avg.responseTimeMs ?? 0
      )
    },
    vendorFleet
  }
}

/* ---------------- GET ALL ---------------- */
exports.list = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query, {
      page: 1,
      limit: 20,
      maxLimit: 100
    })

    const [total, vendors] = await Promise.all([
      prisma.vendor.count(),
      prisma.vendor.findMany({
        include: {
          _count: {
            select: {
              cruises: true,
              ships: true,
              runs: true
            }
          }
        },
        orderBy: { id: "desc" },
        skip,
        take: limit
      })
    ])

    res.json({
      success: true,
      pagination: buildPaginationMeta(total, page, limit),
      data: vendors
    })
  } catch (err) {
    console.error(err)

    res.status(500).json({
      success: false,
      error: err.message
    })
  }
}

/* ---------------- DASHBOARD ---------------- */
exports.dashboard = async (req, res) => {
  try {
    const metrics = await buildVendorMetrics()

    res.json({
      success: true,
      overview: metrics.overview,
      vendor_fleet: metrics.vendorFleet,
      vendor_breakdown: metrics.vendorFleet.map(vendor => ({
        vendor_id: vendor.vendor_id,
        vendor_name: vendor.vendor_name,
        cruise_count: vendor.cruise_count,
        health_score: vendor.health_score,
        total_runs: vendor.total_runs
      }))
    })
  } catch (err) {
    console.error("VENDOR DASHBOARD ERROR:", err)

    res.status(500).json({
      success: false,
      error: err.message
    })
  }
}

/* ---------------- CREATE ---------------- */
exports.create = async (req, res) => {
  try {
    const { name, url, slug } = req.body

    const vendor = await prisma.vendor.create({
      data: { name, url, slug }
    })

    res.json({
      success: true,
      data: vendor
    })
  } catch (err) {
    console.error(err)

    res.status(500).json({
      success: false,
      error: err.message
    })
  }
}

/* ---------------- UPDATE ---------------- */
exports.update = async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { name, url, slug } = req.body

    const vendor = await prisma.vendor.update({
      where: { id },
      data: { name, url, slug }
    })

    res.json({
      success: true,
      data: vendor
    })
  } catch (err) {
    console.error(err)

    res.status(500).json({
      success: false,
      error: err.message
    })
  }
}

/* ---------------- DELETE ---------------- */
exports.remove = async (req, res) => {
  try {
    const id = Number(req.params.id)

    await prisma.vendor.delete({
      where: { id }
    })

    res.json({
      success: true
    })
  } catch (err) {
    console.error(err)

    res.status(500).json({
      success: false,
      error: err.message
    })
  }
}

/* ---------------- GET SINGLE ---------------- */
exports.single = async (req, res) => {
  try {
    const slug = req.params.slug
    const [vendor, totalRuns] = await Promise.all([
      prisma.vendor.findFirst({
        where: {
          slug
        },
        select: {
          id: true,
          name: true,
          slug: true,
          url: true,
          runs: {
            orderBy: {
              finishedAt: "desc"
            },
            take: 10
          },
          _count: {
            select: {
              cruises: true,
              ships: true
            }
          }
        }
      }),
      prisma.vendorRun.count({
        where: {
          vendor: {
            slug
          }
        }
      })
    ])

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found"
      })
    }

    const [coverageCruises, ships, cruises, totalCruises] = await Promise.all([
      prisma.cruise.findMany({
        where: {
          vendorId: vendor.id
        },
        select: {
          startDate: true,
          endDate: true
        }
      }),
      prisma.ship.findMany({
        where: {
          vendorId: vendor.id
        },
        select: {
          code: true,
          name: true
        },
        orderBy: {
          name: "asc"
        },
        take: 10
      }),
      prisma.cruise.findMany({
        where: {
          vendorId: vendor.id
        },
        select: {
          code: true,
          package: true,
          startDate: true,
          endDate: true,
          routeLabel: true,
          ship: true,
          shipCode: true
        },
        orderBy: {
          startDate: "asc"
        },
        take: 10
      }),
      prisma.cruise.count({
        where: {
          vendorId: vendor.id
        }
      })
    ])

    const coverageMonths = getCoverageMonths(coverageCruises)
    const latestRun = vendor.runs[0] ?? null
    const cabinCategoryCount = await prisma.cabinCategory.count({
      where: {
        cruise: {
          vendorId: vendor.id
        }
      }
    })

    res.json({
      success: true,
      data: {
        vendor: {
          id: vendor.id,
          name: vendor.name,
          slug: vendor.slug,
          url: vendor.url
        },
        metrics: {
          health_score: latestRun?.healthScore ?? 0,
          health_label: getHealthLabel(latestRun?.healthScore ?? 0),
          last_status: latestRun?.status ?? "NO_RUNS",
          last_updated_at: latestRun?.finishedAt ?? null,
          total_runs: totalRuns,
          average_response_time_ms: latestRun?.responseTimeMs ?? null,
          error_count: latestRun?.errorCount ?? 0,
          coverage_months: coverageMonths,
          coverage_label: formatCoverageMonths(coverageMonths),
          cruise_count: vendor._count.cruises,
          ship_count: vendor._count.ships,
          cabin_category_count: cabinCategoryCount
        },
        cruises,
        ships,
        runs: vendor.runs,
        cruise_pagination: buildPaginationMeta(totalCruises, 1, 10),
        ship_pagination: buildPaginationMeta(vendor._count.ships, 1, 10)
      }
    })
  } catch (err) {
    console.error(err)

    res.status(500).json({
      success: false,
      error: err.message
    })
  }
}
