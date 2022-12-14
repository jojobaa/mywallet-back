import express from "express"
import cors from "cors"
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import joi from 'joi'
import bcrypt from "bcrypt"
import { v4 as uuid } from 'uuid';
import dayjs from "dayjs";

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

server.post("/sign-in", async (req, res) => {
    const { email, password } = req.body;
    const token = uuid();

    const user = await db.collection("users").findOne({ email });

    if (user && bcrypt.compareSync(password, user.password)) {
        await db.collection("sessions").insertOne({
            token,
            userId: user._id,
        });
        delete user.password
        res.send({ token, ...user });
    } else {
        res.sendStatus(401);
    }
});

server.post("/registrations", async (req, res) => {
    const registro = req.body;

    try {
        await db
            .collection("registrations")
            .insertOne({ ...registro, valor: Number(registro.valor), createdAt: dayjs().format("DD/MM") });
            res.sendStatus(201)
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
});

server.get("/registrations", async (req, res) => {
    const authorization = req.headers.authorization;
    const token = authorization?.replace("Bearer ", "");

    if (!token) {
        res.sendStatus(401);
        return;
    }

    try {
        const sessions = await db.collection("sessions").findOne({ token });

        if (!sessions) {
            res.sendStatus(401);
            return;
        }

        const user = await db.collection("users").findOne({
            _id: sessions.userId,
        });

        if (user) {
            const userRegistrations = await db.collection("registrations").find({ name: user.name }).toArray();
            let balance = 0

            for (let i = 0; i < userRegistrations.length; i++) {
                if (userRegistrations[i].type === "input") {
                    balance += userRegistrations[i].valor
                } else {
                    balance -= userRegistrations[i].valor
                }
            }
            res.send({ userRegistrations, balance });
        }
    } catch (error) {
        console.log(err);
        res.sendStatus(500);
    }
});

server.listen(5000, () => console.log("Server in port 5000"));