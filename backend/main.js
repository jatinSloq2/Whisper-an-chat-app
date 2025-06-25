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

dotenv.config()


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT;
const MONGO_URI = process.env.MONGO_URI;
app.set('trust proxy', 1);
app.use(cors({
    origin: [
        "http://localhost:5173",
        "http://192.168.60.196:5173",
        "https://c8b2-2409-40d4-30d2-af08-7c6a-d5c6-985e-9083.ngrok-free.app",
        "https://merry-licorice-ef90b0.netlify.app/"
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
}));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRouter);
app.use('/api/forgetpassword', forgetPassRouter)
app.use('/api/contact', contactRouter);
app.use('/api/messages', msgRouter);
app.use('/api/group', groupRouter)
mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
    });


// Start the server
const server = app.listen(PORT, () => {
    console.log(`The server is live on http://localhost:${PORT}`);
});

setupSocket(server)