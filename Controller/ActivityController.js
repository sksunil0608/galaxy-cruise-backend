const prisma = require("../Utils/prisma")

exports.log = async (req, res) => {
  try {
    const { action, details, userEmail } = req.body
    if (!action) return res.json({ success: true })

    await prisma.userActivity.create({
      data: {
        userId:    req.user?.id    ?? null,
        userEmail: req.user?.email ?? userEmail ?? null,
        action:    String(action).slice(0, 100),
        details:   details ?? null,
        ip:        (req.ip || req.socket?.remoteAddress)?.replace("::ffff:", "") ?? null
      }
    })

    res.json({ success: true })
  } catch {
    res.json({ success: false })
  }
}

exports.list = async (req, res) => {
  try {
    const limit  = Math.min(Number(req.query.limit)  || 30, 200)
    const offset = Math.max(Number(req.query.offset) || 0, 0)
    const action = req.query.action || undefined
    const search = req.query.search || undefined

    const where = {}
    if (action) where.action = action
    if (search) {
      where.OR = [
        { userEmail: { contains: search } },
        { user: { name: { contains: search } } }
      ]
    }

    const [total, activities] = await Promise.all([
      prisma.userActivity.count({ where }),
      prisma.userActivity.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take:    limit,
        skip:    offset,
        include: { user: { select: { id: true, name: true, email: true } } }
      })
    ])

    res.json({ success: true, data: activities, total, limit, offset })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}
