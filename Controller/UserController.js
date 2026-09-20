const prisma = require("../Utils/prisma")
const bcrypt = require("bcrypt")

exports.getUsers = async (req,res)=>{
  const users = await prisma.user.findMany({
    include:{ role:true }
  })
  res.json(users)
}

exports.getUser = async (req,res)=>{
  const id = parseInt(req.params.id)

  const user = await prisma.user.findUnique({
    where:{id},
    include:{ role:true }
  })

  res.json(user)
}

exports.createUser = async (req,res)=>{

  const {name,email,password,role_id,roleId} = req.body
  const resolvedRoleId = Number(roleId ?? role_id)

  const hashed = await bcrypt.hash(password,10)

  const user = await prisma.user.create({
    data:{
      name,
      email,
      password:hashed,
      role:{
        connect:{id:resolvedRoleId}
      }
    }
  })

  res.json(user)
}

exports.updateUser = async (req,res)=>{

  const id = parseInt(req.params.id)

  const {name,email,role_id,roleId} = req.body
  const resolvedRoleId = Number(roleId ?? role_id)

  const user = await prisma.user.update({
    where:{id},
    data:{
      name,
      email,
      role:{
        connect:{id:resolvedRoleId}
      }
    }
  })

  res.json(user)
}

exports.deleteUser = async (req,res)=>{

  const id = parseInt(req.params.id)

  await prisma.user.delete({
    where:{id}
  })

  res.json({message:"User deleted"})
}
