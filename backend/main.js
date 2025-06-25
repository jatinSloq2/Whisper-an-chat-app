import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import authRouter from './routes/auth.routes.js';
import forgetPassRouter from './routes/forgetPass.routes.js';
import contactRouter from './routes/contact.routes.js';
import msgRouter from './routes/messages.routes.js';
import groupRouter from './routes/group.routes.js';
import path from 'path';
import { fileURLToPath } from 'url';
import setupSocket from './socket.js';
import callRouter from './routes/xirsys.js';

dotenv.config()

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT;
const MONGO_URI = process.env.MONGO_URI;
app.set('trust proxy', 1);
const allowedOrigins = [
    "http://localhost:5173",
    "https://whisper-for-chat.netlify.app",
];
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn("❌ CORS blocked:", origin);
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
}));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.json());
app.use(cookieParser());
app.get("/", (req, res) => res.send("Hello"))
app.use("/api/call", callRouter)
app.use('/api/auth', authRouter);
app.use('/api/forgetpassword', forgetPassRouter)
app.use('/api/contact', contactRouter);
app.use('/api/messages', msgRouter);
app.use('/api/group', groupRouter)

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true, })
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err))

const server = app.listen(PORT, () => console.log(`The server is live on http://localhost:${PORT}`));
setupSocket(server)
