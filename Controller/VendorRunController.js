const prisma = require("../Utils/prisma")
const {
  parsePagination,
  buildPaginationMeta
} = require("../Utils/pagination")

const buildVendorRunData = body => ({
  vendorId: Number(body.vendorId),
  status: body.status,
  healthScore: body.healthScore ?? 0,
  responseTimeMs: body.responseTimeMs ?? null,
  startedAt: body.startedAt ? new Date(body.startedAt) : new Date(),
  finishedAt: body.finishedAt ? new Date(body.finishedAt) : null,
  cruisesSeen: body.cruisesSeen ?? 0,
  shipsSeen: body.shipsSeen ?? 0,
  cabinCategoriesSeen: body.cabinCategoriesSeen ?? 0,
  errorCount: body.errorCount ?? 0,
  notes: body.notes ?? null
})

exports.list = async (req, res) => {
  try {
    const where = {}

    if (req.query.vendorId) {
      where.vendorId = Number(req.query.vendorId)
    }

    const { page, limit, skip } = parsePagination(req.query, {
      page: 1,
      limit: 20,
      maxLimit: 100
    })

    const [total, runs] = await Promise.all([
      prisma.vendorRun.count({ where }),
      prisma.vendorRun.findMany({
        where,
        include: {
          vendor: true
        },
        orderBy: {
          startedAt: "desc"
        },
        skip,
        take: limit
      })
    ])

    res.json({
      success: true,
      count: runs.length,
      pagination: buildPaginationMeta(total, page, limit),
      data: runs
    })
  } catch (err) {
    console.error("VENDOR RUN LIST ERROR:", err)

    res.status(500).json({
      success: false,
      error: err.message
    })
  }
}

exports.getOne = async (req, res) => {
  try {
    const run = await prisma.vendorRun.findUnique({
      where: {
        id: Number(req.params.id)
      },
      include: {
        vendor: true
      }
    })

    if (!run) {
      return res.status(404).json({
        success: false,
        error: "Vendor run not found"
      })
    }

    res.json({
      success: true,
      data: run
    })
  } catch (err) {
    console.error("VENDOR RUN GET ERROR:", err)

    res.status(500).json({
      success: false,
      error: err.message
    })
  }
}

exports.create = async (req, res) => {
  try {
    const run = await prisma.vendorRun.create({
      data: buildVendorRunData(req.body),
      include: {
        vendor: true
      }
    })

    res.status(201).json({
      success: true,
      data: run
    })
  } catch (err) {
    console.error("VENDOR RUN CREATE ERROR:", err)

    res.status(400).json({
      success: false,
      error: err.message
    })
  }
}

exports.update = async (req, res) => {
  try {
    const run = await prisma.vendorRun.update({
      where: {
        id: Number(req.params.id)
      },
      data: buildVendorRunData(req.body),
      include: {
        vendor: true
      }
    })

    res.json({
      success: true,
      data: run
    })
  } catch (err) {
    console.error("VENDOR RUN UPDATE ERROR:", err)

    res.status(400).json({
      success: false,
      error: err.message
    })
  }
}

exports.remove = async (req, res) => {
  try {
    await prisma.vendorRun.delete({
      where: {
        id: Number(req.params.id)
      }
    })

    res.json({
      success: true,
      message: "Vendor run deleted"
    })
  } catch (err) {
    console.error("VENDOR RUN DELETE ERROR:", err)

    res.status(500).json({
      success: false,
      error: err.message
    })
  }
}
