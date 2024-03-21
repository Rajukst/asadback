const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: 'unauthorized access' });
  }
  // bearer token
  const token = authorization.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ error: true, message: 'unauthorized access' })
    }
    req.decoded = decoded;
    next();
  })
}


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yyhry.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

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

    // const usersCollection = client.db("talikhata").collection("users");
    const grahokCollection = client.db("talikhata").collection("allClients");
    const paymentList = client.db("talikhata").collection("allPayments");
    const adminUserList = client.db("talikhata").collection("adminUser");

    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '20m' })

      res.send({ token })
    })
 // Warning: use verifyJWT before using verifyAdmin
 const verifyAdmin = async (req, res, next) => {
  const email = req.decoded.email;
  const query = { email: email }
  const user = await adminUserList.findOne(query);
  if (user?.role !== 'admin') {
    return res.status(403).send({ error: true, message: 'forbidden message' });
  }
  next();
}

/**
 * 0. do not show secure links to those who should not see the links
 * 1. use jwt token: verifyJWT
 * 2. use verifyAdmin middleware
*/

// users related apis
app.get('/adminusers', verifyJWT, verifyAdmin, async (req, res) => {
  const result = await adminUserList.find().toArray();
  res.send(result);
});
app.delete('/adminusers/:id', verifyJWT,verifyAdmin, async(req, res)=>{
  const id= req.params.id;
  const query= {_id: new ObjectId(id)}
  const result= await adminUserList.deleteOne(query)
  res.json(result)
})
app.post('/adminusers', async (req, res) => {
  const user = req.body;
  const query = { email: user.email }
  const existingUser = await adminUserList.findOne(query);

  if (existingUser) {
    return res.send({ message: 'user already exists' })
  }

  const result = await adminUserList.insertOne(user);
  res.send(result);
});

// security layer: verifyJWT
// email same
// check admin
app.get('/adminusers/admin/:email', verifyJWT, async (req, res) => {
  const email = req.params.email;

  if (req.decoded.email !== email) {
    res.send({ admin: false })
  }

  const query = { email: email }
  const user = await adminUserList.findOne(query);
  const result = { admin: user?.role === 'admin' }
  res.send(result);
})

app.patch('/adminusers/admin/:id', verifyJWT, verifyAdmin, async (req, res) => {
  const id = req.params.id;
  console.log(id);
  const filter = { _id: new ObjectId(id) };
  const updateDoc = {
    $set: {
      role: 'admin'
    },
  };

  const result = await adminUserList.updateOne(filter, updateDoc);
  res.send(result);

})

// Normal User List
    app.post("/users", async (req, res) => {
        const getData= req.body;
        const result = await grahokCollection.insertOne(getData)
        res.send(result);
    })
    app.post('/paymentList', async (req, res) => {
      const getData = req.body;
      const result = await paymentList.insertOne(getData);
      res.send(result);
    });
    app.get('/paymentList', verifyJWT, async (req, res) => {
      const cursor = paymentList.find({});
      const getData = await cursor.toArray();
      res.json(getData);
      // console.log(getData);
    });
    app.post('/payment', async (req, res) => {
      const getData = req.body;
      const result = await paymentList.insertOne(getData);
      res.send(result);
    });
    // getting results of posting all grahok data
    app.get("/detaCollection", verifyJWT, async (req, res) => {
        const cursor = grahokCollection.find({});
        const getData = await cursor.toArray();
        res.json(getData);
        // console.log(getData);
      });
      app.get("/detaCollection/:id", verifyJWT, async(req, res)=>{
        const productId= req.params.id;
        const query = {_id: new ObjectId(productId)};
        const getCount= await grahokCollection.findOne(query);
        // console.log("getting a single product", getCount);
        res.send(getCount);
      })
      // getharing single user report data
      app.get("/reportdata/:id", verifyJWT, async(req, res)=>{
        const productId= req.params.id;
        const query = {_id: new ObjectId(productId)};
        const getCount= await grahokCollection.findOne(query);
        // console.log("getting a single product", getCount);
        res.send(getCount);
      })
      app.get("/editdata/:id", verifyJWT, async(req, res)=>{
        const productId= req.params.id;
        const query = {_id: new ObjectId(productId)};
        const getCount= await grahokCollection.findOne(query);
        // console.log("getting a single product", getCount);
        res.send(getCount);
      })

      app.get("/deletefetchdata/:id", verifyJWT, async(req, res)=>{
        const productId= req.params.id;
        const query = {_id: new ObjectId(productId)};
        const getCount= await grahokCollection.findOne(query);
        // console.log("getting a single product", getCount);
        res.send(getCount);
      })
      app.delete('/deleteuserdata/:userId', verifyJWT, async (req, res) => {
        const userId = req.params.userId;
        try {
          // Delete all transactions associated with the user ID
          const deleteResult = await paymentList.deleteMany({ usrId: userId });
          console.log(`Deleted ${deleteResult.deletedCount} transactions for user with ID ${userId}`);
      
          // Delete the user from the allClients collection
          const deleteClientResult = await grahokCollection.deleteOne({ _id: new ObjectId(userId) });
          if (deleteClientResult.deletedCount === 0) {
            console.log(`User with ID ${userId} not found in allClients collection`);
          } else {
            console.log(`Deleted user with ID ${userId} from allClients collection`);
          }
      
          res.json({ message: `Deleted ${deleteResult.deletedCount} transactions and user from allClients collection` });
        } catch (error) {
          console.error('Error deleting user transactions:', error);
          res.status(500).json({ message: 'Internal server error' });
        }
      });
app.put("/editdata/:id", verifyJWT, async (req, res) => {
  const userId = req.params.id;
  const updateUser = req.body;
  const filter = { _id: new ObjectId(userId) };
  const options = { upsert: true };
  const updatedDoc = {
    $set: {
      name: updateUser.name,
      mobile: updateUser.mobile,
    }
  };

  try {
    // Update user information in allClients collection
    const updateResult = await grahokCollection.updateOne(filter, updatedDoc, options);
    console.log(`Updated user with ID ${userId} in allClients collection`);

    // Update user information in allPayments collection
    const updatePaymentsResult = await paymentList.updateMany({ usrId: userId }, updatedDoc);
    console.log(`Updated ${updatePaymentsResult.modifiedCount} documents in allPayments collection`);

    res.json({ message: `User information updated successfully` });
  } catch (error) {
    console.error('Error updating user information:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.get("/reportTableData/:id", verifyJWT, async(req, res)=>{
  const productId= req.params.id;
  const query = {_id: new ObjectId(productId)};
  const getCount= await paymentList.findOne(query);
  // console.log("getting a single product", getCount);
  res.send(getCount);
})
// Update ProductSaleList
  app.put("/editReportTabledata/:id", verifyJWT, async(req, res)=>{
    const id= req.params.id;
    const updateUser= req.body;
    const filter = { _id : new ObjectId(id) }
    const options = { upsert: true };
    const updatedDoc = {
      $set: {
        give:updateUser.give,
        got: updateUser.got,
        paydetails: updateUser.paydetails,
        currentDate: updateUser.currentDate,
      }
  }
  const result = await paymentList.updateOne(filter, updatedDoc, options)
  res.json(result)
  })
  app.delete("/reporttabledata/:id", verifyJWT, async (req, res) =>{
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await paymentList.deleteOne(query);
    console.log("deleting size", result);
    res.json(result);
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


app.get('/', (req, res) => {
  res.send('telecom server is running')
})

app.listen(port, () => {
  console.log(`Telecom is Running on port ${port}`);
})
