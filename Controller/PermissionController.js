const prisma = require("../Utils/prisma")

exports.getPermissions = async (req,res)=>{

  const permissions = await prisma.permission.findMany()

  res.json(permissions)
}

exports.createPermission = async (req,res)=>{

  const {key,name} = req.body

  const permission = await prisma.permission.create({
    data:{ key,name }
  })

  res.json(permission)
}

exports.updatePermission = async (req,res)=>{

  const id = parseInt(req.params.id)

  const {key,name} = req.body

  const permission = await prisma.permission.update({
    where:{id},
    data:{key,name}
  })

  res.json(permission)
}

exports.deletePermission = async (req,res)=>{

  const id = parseInt(req.params.id)

  await prisma.permission.delete({
    where:{id}
  })

  res.json({message:"Permission deleted"})
}
