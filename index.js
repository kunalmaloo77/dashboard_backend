const express = require('express');
const mongoose = require('mongoose');
const clientRouter = require('./routes/client');
const dotenv = require('dotenv')
dotenv.config();
const app = express();
const port = 8080;
const cors = require('cors');
const uri = `mongodb+srv://${process.env.NAME}:${process.env.PASSWORD}@cluster0.izbn67e.mongodb.net/${process.env.DATABASE}?retryWrites=true&w=majority`

main().catch((error)=>{
    console.log("promise error ->",error);
})

async function main () { 
    try {
        await mongoose.connect(uri);
        console.log('connected');
    } catch (error) {
        console.log("async error ->",error);
    }
}

app.use(cors());

app.use(express.json());

app.use('/clients', clientRouter);

app.listen(port, ()=>{
    console.log(`Server started on port ${port}`);
})