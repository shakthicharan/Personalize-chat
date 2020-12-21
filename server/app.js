const express = require('express')
const app = express()
const mongoose = require('mongoose')
const PORT = 5000
const {MONGOURI} = require('./config/keys')


mongoose.connect(MONGOURI,{
    useNewUrlParser:true,
    useUnifiedTopology:true
})

mongoose.connection.on('connected',()=>{
    console.log("connected mongo DB successfully")
})

mongoose.connection.on('error',(err)=>{
    console.log("error connecting",err)
})

require('./models/user')
require('./models/post')

app.use(express.json())
app.use(require('./routes/auth'))
app.use(require('./routes/post'))

app.listen(PORT,()=>{
    console.log('Server is running',PORT)
})


/*const express = require('express')
const app = express()
const PORT = 5000

app.get('/',(req,res)=>{
    res.send('Hello shakthi')
})

app.listen(PORT,()=>{
    console.log("Server is running on",PORT)
})*/