import express from "express"
import cors from "cors"
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import joi from 'joi'
import bcrypt from "bcrypt"

dotenv.config();

// const userSchema = joi.object({
//   name: joi.string().required()
// });

// const messageSchema = joi.object({
//   to: joi.string().required(),
//   text: joi.string().required(),
//   type: joi.string().valid("message", "private_message").required()
// });

const server = express();
server.use(cors());
server.use(express.json());

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;

await mongoClient.connect().then(() => {
  db = mongoClient.db("My-wallet");
});

server.post("/sign-up", async (req, res) => {
    const user = req.body;
    const hashPassword = bcrypt.hashSync(user.password, 10);
  
    try {
      await db.collection("users").insertOne({ ...user, password: hashPassword });
      res.sendStatus(201);
    } catch (err) {
      console.log(err);
      res.sendStatus(500);
    }
  });

server.listen(5000, () => console.log("Server in port 5000"));