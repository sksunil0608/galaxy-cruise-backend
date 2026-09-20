const prisma = require("../Utils/prisma")

exports.getRoles = async (req,res)=>{

  const roles = await prisma.role.findMany({
    include:{
      permissions:{
        include:{
          permission:true
        }
      }
    }
  })

  res.json(roles)
}

exports.createRole = async (req,res)=>{

  const {name} = req.body

  const role = await prisma.role.create({
    data:{name}
  })

  res.json(role)
}

exports.updateRole = async (req,res)=>{

  const id = parseInt(req.params.id)
  const {name} = req.body

  const role = await prisma.role.update({
    where:{id},
    data:{name}
  })

  res.json(role)
}

exports.deleteRole = async (req,res)=>{

  const id = parseInt(req.params.id)

  await prisma.role.delete({
    where:{id}
  })

  res.json({message:"Role deleted"})
}

exports.assignPermission = async (req,res)=>{

  const {role_id,permission_id,roleId,permissionId} = req.body
  const resolvedRoleId = Number(roleId ?? role_id)
  const resolvedPermissionId = Number(permissionId ?? permission_id)

  const rp = await prisma.rolePermission.create({
    data:{
      role:{
        connect:{id:resolvedRoleId}
      },
      permission:{
        connect:{id:resolvedPermissionId}
      }
    }
  })

  res.json(rp)
}
