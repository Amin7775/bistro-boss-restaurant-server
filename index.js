const express = require('express');
const cors = require('cors');
const app = express()
require('dotenv').config()
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

app.get('/', async(req,res)=>{
    res.send('Bistro Boss In Running');
})

app.listen(port,()=>{
    console.log(`Bistro Boss is running on server : ${port}`)
})