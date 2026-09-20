const prisma = require("../Utils/prisma")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

exports.register = async (req,res)=>{

  try{

    const {name,email,password} = req.body

    if(!name || !email || !password){
      return res.status(400).json({
        message:"Name, email and password required"
      })
    }

    const existing = await prisma.user.findUnique({
      where:{email}
    })

    if(existing){
      return res.status(400).json({
        message:"Email already exists"
      })
    }

    const hashedPassword = await bcrypt.hash(password,10)

    const role = await prisma.role.findFirst({
      where:{
        OR:[
          { name:"Admin" },
          { name:"admin" }
        ]
      }
    })

    if(!role){
      return res.status(500).json({
        message:"Role not found"
      })
    }

    const user = await prisma.user.create({
      data:{
        name,
        email,
        password:hashedPassword,
        role:{
          connect:{id:role.id}
        }
      }
    })

    res.json({
      message:"User registered",
      user:{
        id:user.id,
        name:user.name,
        email:user.email
      }
    })

  }catch(err){

    console.error(err)

    res.status(500).json({
      message:"Server error"
    })

  }

}
exports.login = async (req,res)=>{

  try{

    const {email,password} = req.body

    const user = await prisma.user.findUnique({
      where:{email},
      include:{
        role:{
          include:{
            permissions:{
              include:{
                permission:true
              }
            }
          }
        }
      }
    })

    if(!user){
      return res.status(400).json({
        message:"Invalid credentials"
      })
    }

    const match = await bcrypt.compare(password,user.password)

    if(!match){
      return res.status(400).json({
        message:"Invalid credentials"
      })
    }

    const permissions = user.role.permissions.map(
      p => p.permission.key
    )

    const token = jwt.sign(
      {
        id:user.id,
        roleId:user.roleId
      },
      process.env.JWT_SECRET,
      {expiresIn:"7d"}
    )

    res.json({
      token,
      user:{
        id:user.id,
        name:user.name,
        email:user.email,
        role:user.role.name
      },
      permissions
    })

  }catch(err){

    console.error(err)

    res.status(500).json({
      message:"Server error"
    })

  }

}
