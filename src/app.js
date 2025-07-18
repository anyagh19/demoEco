import express from "express";
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from "cookie-parser";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

dotenv.config({
    path: './.env'
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());

app.use(injectUser)
// Import routes
import healthcheckRouter from './routes/healthcheck.route.js';
import userRoute from './routes/user.route.js'
import commonRoute from './routes/common.route.js'
import { injectUser } from "./middleware/injectuser.middleware.js";
import offerRoute from './routes/offer.route.js'

// Routes
app.use('/', commonRoute)
app.use("/api/v1/healthcheck", healthcheckRouter);
app.use("/api/v1/user", userRoute)
app.use("/api/v1/", offerRoute )

export { app };
