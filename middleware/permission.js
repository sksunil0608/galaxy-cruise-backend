const prisma = require("../Utils/prisma")

module.exports = (permissionKey)=>{

 return async (req,res,next)=>{

  const roleId = req.user.roleId ?? req.user.role_id

  const rolePermission = await prisma.rolePermission.findFirst({
   where:{
    roleId:roleId,
    permission:{
     key:permissionKey
    }
   },
   include:{permission:true}
  })

  if(!rolePermission){
   return res.status(403).json({message:"Forbidden"})
  }

  next()

 }

}
