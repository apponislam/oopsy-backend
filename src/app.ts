import express, { Application, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import notFound from "./errors/notFound";
import globalErrorHandler from "./errors/globalErrorhandler";
import router from "./app/routes";

const app: Application = express();

app.use("/api/v1/transactions/webhook", express.raw({ type: "application/json" }));

const corsOptions = {
    origin: ["http://localhost:3030", "http://10.10.7.24:3030", "http://fundraising.apponislam.top", "https://fundraising.apponislam.top", "http://10.10.26.171:3030"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
};

app.use(cors(corsOptions));

// Stripe Webhook requires raw body parsing for signature validation

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "../public")));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/", (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.get("/api/v1/status", (req: Request, res: Response) => {
    res.json({
        success: true,
        data: {
            environment: process.env.NODE_ENV || "development",
            port: process.env.PORT || 5000,
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
        },
    });
});

app.use("/api/v1", router);

app.use(notFound);
app.use(globalErrorHandler);

export default app;
