const express = require('express')
const router = express.Router()
const mangoose = require('mongoose')
const User = mangoose.model("User")
const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const {JWT_SECRET} = require('../config/keys')
const requireLogin = require('../middleware/requireLogin')
const nodemailer = require('nodemailer')
const sendgridTransporter = require('nodemailer-sendgrid-transport')
const {SENDGRID_API,EMAIL} = require('../config/keys')

const transporter = nodemailer.createTransport(sendgridTransporter({
    auth:{
        api_key:SENDGRID_API
    }
}))

router.post('/signup',(req,res)=>{
      const {name,email,password,pic} = req.body
      if(!email|| !password || !name){
        return res.status(422).json({message:"please add all the fields"})
      }
    User.findOne({email:email})
     .then((savedUser)=>{
         if(savedUser){
            return res.status(422).json({message:"user already exists with that email"})
         }

         bcrypt.hash(password,12)
         .then(hashedpassword=>{

            const user = new User({
                email,
                password:hashedpassword,
                name,
                pic
            })
   
            user.save()
            .then(user=>{
               res.json({message:"saved successfully in Batabase"})
            })
            .catch(err=>{
                console.log(err)
            })
        }) 
    })
     .catch(err=>{
        console.log(err)
      })
})


router.post("/signin",(req,res)=>{
   const {email,password} = req.body
    if(!email || !password){
        return  res.status(422).json({error:"please add email or password"})
    }
    User.findOne({email:email})
    .then(savedUser=>{
        if(!savedUser){
           return res.status(422).json({error:"Invalid email or password"})
        }
        bcrypt.compare(password,savedUser.password)
        .then(doMatch =>{
            if(doMatch){
                const token = jwt.sign({_id:savedUser._id},JWT_SECRET)
                const {_id,name,email} = savedUser
                res.json({token,user:{_id,name,email}})
            }
            else{
                return res.status(422).json({error:"Invalid email or password"})
            }
        })
        .catch(err=>{
            console.log(err) 
        })
    })
})

router.post('/reset-password',(req,res)=>{
    crypto.randomBytes(32,(err,buffer)=>{
        if(err){
            console.log(err)
        }
        const token = buffer.toString("hex")
        User.findOne({email:req.body.email})
        .then(user=>{
            if(!user){
                return res.status(422).json({error:"User dont exist with that email"})
            }
            user.resetToken = token
            user.expireToken = Date.now() + 3600000
            user.save().then((result)=>{
                transporter.sendMail({
                    to:user.email,
                    from:"no-replay@shakthi.com",
                    subject:"password reset",
                    html:`
                        <p>You requested for password reset</p>
                        <h5>click in this <a href="${EMAIL}/reset${token}">link</>to reset password</h5>
                        `
                })
                res.json({message:"check your email"})
            })
        })
    })
})

router.post('/new-password',(req,res)=>{   
    const newPassword = req.body.password
    const sentToken = req.body.token
    User.findOne({resetToken:sentToken,expireToken:{$gt:Date.now()}})
    .then(user=>{
        if(!user){
            return res.status(422).json({error:"Try again session expired"})
        }
        bcrypt.hash(newPassword,12).then(hashedpassword=>{
            user.password = hashedpassword
            user.resetToken = undefined
            user.expireToken = undefined
            user.save().then((savedUser)=>{
                res.json({message:"password updated success"})
            })
        })
    }).catch(err=>{
        console.log(err)
    })
})

module.exports = router