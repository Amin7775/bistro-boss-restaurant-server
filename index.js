const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken')
const app = express()
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

app.get('/', async(req,res)=>{
    res.send('Bistro Boss In Running');
})

//mongoDB 

const uri = `mongodb+srv://${process.env.DB_User}:${process.env.DB_Password}@cluster0.x4cetjc.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const database = client.db("Bistro_Boss_Restaurent");
    const menuCollection = database.collection("menu");
    const cartCollection = database.collection("cart");
    const userCollection = database.collection("users");

    //jwt related api
    app.post('/jwt', async(req,res)=>{
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1h'
      })
      res.send({token})
    })

    //middleware
    const verifyToken = (req,res,next)=>{
      console.log("From verify",req.headers)
      if(!req.headers.authorization){
        return res.status(401).send({message: 'Forbidden Access'})
      }
      const token = req.headers.authorization.split(' ')[1]
      console.log("TokeNs: " , token)
      jwt.verify(token,process.env.ACCESS_TOKEN_SECRET, (err,decoded)=>{
        if(err){
          return res.status(401).send({message: 'Forbidden Access'})
        }
        req.decoded = decoded
        next()
      })
    }

     //verify admin(option 2)
     const verifyAdmin =async (req,res,next)=>{
      const email = req.decoded.email;
      const query = {email : email}
      const user = await userCollection.findOne(query)
      const isAdmin = user?.role == 'admin'
      if(!isAdmin){
        return res.status(403).send({message: 'Forbidden Access'})
      }
      next()
    }

    //user related api
    app.post('/users', async(req,res)=>{
      const user = req.body;
      const query = {email : user.email}
      const existingUser = await userCollection.findOne(query)
      if(existingUser){
        return res.send({message: 'User Already Exist', insertedId: null})
      }
      const result = await userCollection.insertOne(user)
      res.send(result)
    })   

    app.get('/users',verifyToken,verifyAdmin, async(req,res)=>{
      const cursor = userCollection.find();
      const result = await cursor.toArray();
      res.send(result)
    })

    //to get the current email and verify admin
    app.get('/users/admin/:email', verifyToken, async(req,res)=>{
      const email = req.params.email;
      if(email !== req.decoded.email){
        return res.status(403).send({message: 'Unauthorized Access'})
      }

      const query = {email : email}
      const user = await userCollection.findOne(query)
      let admin = false
      if(user){
        admin = user?.role === 'admin';
      }
      res.send({admin})
    })

   

    app.delete('/users/:id',verifyToken,verifyAdmin, async(req,res)=>{
      const id = req.params.id
      const query = {_id : new ObjectId(id)}
      const result = await userCollection.deleteOne(query)
      res.send(result)
    })

    app.patch('/users/admin/:id',verifyToken,verifyAdmin, async(req,res)=>{
      const id = req.params.id;
      const filter = {_id : new ObjectId(id)}
      const updatedDoc = {
        $set:{
          role: 'admin'
        }
      }
      const result = await userCollection.updateOne(filter,updatedDoc)
      res.send(result)
    })

    //menu collection
    app.get('/menu', async(req,res)=>{
        const cursor = menuCollection.find();
        const result = await cursor.toArray();
        res.send(result)
    })


    //cart collection
    app.post('/cart', async(req,res)=>{
      const cartItem = req.body;
      const result = await cartCollection.insertOne(cartItem)
      res.send(result)
    })

    app.get('/cart', async(req,res)=>{
      const email = req.query.email;
      const query = {email : email}
      const cursor = cartCollection.find(query)
      const result = await cursor.toArray()
      res.send(result)
    })

    app.delete('/cart/:id', async(req,res)=>{
      const id = req.params.id;
      const query = {_id : new ObjectId(id)}
      const result = await cartCollection.deleteOne(query)
      res.send(result)
    })
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.listen(port,()=>{
    console.log(`Bistro Boss is running on server : ${port}`)
})