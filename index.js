const express = require('express')
const app = express()
const cors = require('cors');
const admin = require("firebase-admin");
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId, Admin } = require('mongodb');
const port = process.env.PORT || 7000;

// const serviceAccount = require('./another-one-12-firebase-adminsdk.json')
// const serviceAccount =JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)

admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
  credential: admin.credential.applicationDefault()
});





app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.edakn.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

console.log("succesfully", uri)


async function verifyToken(req, res, next){
    if(req.headers?.authorization?.startsWith('Bearer ')){

        // aidik a (' ') arkom space dite hobe naile undefind asbe 

        const token =req.headers.authorization.split(' ')[1];
 

try{
    const decodedUser = await admin.auth().verifyIdToken(token);
    req.decodedEmail = decodedUser.email;
}
catch{

}


    }
    next();
}




async function run() {
    try {
        await client.connect();
        console.log('database connected succesfully');
        const database = client.db('data_collection');
        const usersCollection = database.collection('users');
        const deliveryCollection = database.collection('products')
        const collectOrder = database.collection('order')
        const orderInformation = database.collection('addProducts')
        const reviewUser = database.collection('userReview')




        app.get('/products', async (req, res) => {
            const cursor = deliveryCollection.find({});
            const products = await cursor.toArray();
            res.send(products);
        })

        app.get('/products/:_id', async (req, res) => {
            const id = req.params._id;
            console.log('getting specific service', id);
            const query = { _id: (id) };
            const service = await deliveryCollection.findOne(query);
            res.json(service)

        })

        app.post('/order', async (req, res) => {
            const order = req.body;
            const result = await collectOrder.insertOne(order);
            console.log(result)
            res.json(result)
        });


        // email dia query kore user er order dekhaitesi
        app.get('/order', async (req, res) => {
            const email =  req.query.email;
            const query ={ email:email};
            const cursor = collectOrder.find(query);
            const products = await cursor.toArray();
            res.send(products);
        })
        app.delete('/order/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await collectOrder.deleteOne(query);
            res.json(result)
        })

        // add new service
        app.post('/addProducts', async (req, res) => {
            const order = req.body;
            console.log('hit the post api', order)
            const result = await orderInformation.insertOne(order);
            console.log(result);
            res.json(result)
        })
        app.get('/addProducts', async (req, res) => {
            const cursor = orderInformation.find({});
            const products = await cursor.toArray();
            res.send(products);
        })
        app.get('/addProducts/:_id', async (req, res) => {
            const id = req.params._id;
            console.log('getting specific service', id);
            const query = { _id: (id) };
            const service = await orderInformation.findOne(query);
            res.json(service)

        })

        // delete api
        app.delete('/addProducts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await orderInformation.deleteOne(query);
            res.json(result)
        })

        // users data colllection 
        app.post('/users', async (req, res) => {
            const user = req.body;
            console.log('post', user)
            const result = await usersCollection.insertOne(user);
            console.log(result)
            res.json(result)
        })
app.get('/users/:email', async(req, res)=>{
    const email = req.params.email;
    const query = {email: email};
    const user = await usersCollection.findOne(query);

let isAdmin = false;

    if(user?.role === 'admin'){
isAdmin = true;
    }
    res.json({admin: isAdmin});
})



        // user ke update korar jonno
        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await usersCollection.updateOne(filter, updateDoc, options);

            res.json(result);
        })

        app.put('/users/admin',verifyToken, async(req, res)=>{
            const user = req.body;
            console.log(user);
       const requester = req.decodedEmail;
       if(requester){
           const requesterAccount = await usersCollection.findOne({email: requester });
           if(requesterAccount.role === 'admin'){

            const filter = {email: user.email};
            const updateDoc = {$set:{ role:'admin'}};
            const result = await usersCollection.updateOne(filter, updateDoc);
            console.log(result)
            res.json(result);
           }

       }
    else{
        // search http status code
        res.status(403).json({message:'you do not have access to make admin'});
    }

        })

// user Review
app.post('/userReview', async (req, res) => {
    const review = req.body;
    const result = await reviewUser.insertOne(review);
    res.json(result)
});


app.get('/userReview', async (req, res) => {
    const cursor = reviewUser.find({});
    const reviews = await cursor.toArray();
    res.send(reviews);
})



    }
    finally {
        // await client.close();
    }
}
run().catch(console.dir)




app.get('/', (req, res) => {
    res.send("Hello Car World")
})
app.listen(port, () => {
    console.log(`listening${port}`);
})