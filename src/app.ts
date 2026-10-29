import express, { Application, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./app/docs/swagger";
import notFound from "./errors/notFound";
import globalErrorHandler from "./errors/globalErrorhandler";
import router from "./app/routes";

const app: Application = express();

app.use("/api/v1/payments/webhook", express.raw({ type: "application/json" }));

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

// Swagger Interactive API Documentation
const swaggerUiOptions = {
    customCss: `
        .swagger-ui .topbar { display: none }
        .swagger-ui { background-color: #0b0f19; color: #f1f5f9; font-family: 'Outfit', sans-serif, -apple-system; }
        .swagger-ui .info .title { color: #06b6d4; font-weight: 800; }
        .swagger-ui .info a { color: #0ea5e9; }
        .swagger-ui .scheme-container { background: #0f172a; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08); }
        .swagger-ui .opblock { border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.06); }
        .swagger-ui .btn.authorize { background-color: #0B6E7F; color: #fff; border-color: #0B6E7F; border-radius: 8px; }
        .swagger-ui .btn.authorize svg { fill: #fff; }
    `,
    customSiteTitle: "Oopsy Backend | API Documentation",
    customfavIcon: "/favicon.png",
};

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));
app.get("/api-docs.json", (req: Request, res: Response) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
});

app.use("/api/v1", router);

app.use(notFound);
app.use(globalErrorHandler);

export default app;
