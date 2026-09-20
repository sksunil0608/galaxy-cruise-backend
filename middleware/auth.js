const jwt = require("jsonwebtoken")
const prisma = require("../Utils/prisma")

module.exports = async function(req,res,next){

 const token = req.headers.authorization?.split(" ")[1]

 if(!token){
  return res.status(401).json({message:"Unauthorized"})
 }

 try{

  const decoded = jwt.verify(token,process.env.JWT_SECRET)

  if (decoded.roleId || decoded.role_id) {
   req.user = decoded
   return next()
  }

  const user = await prisma.user.findUnique({
   where:{ id: decoded.id },
   select:{ id:true, roleId:true }
  })

  if(!user){
   return res.status(401).json({message:"Invalid token"})
  }

  req.user = {
   ...decoded,
   roleId:user.roleId
  }

  next()

}catch(err){
  return res.status(401).json({message:"Invalid token"})
 }

}
