import "dotenv/config";

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import session from "express-session";
import MongoStore from "connect-mongo";
import { rateLimit } from "express-rate-limit";

import { connectDB } from "./config/db";
import authRouter from "./routes/auth";
import todoRouter from "./routes/todos";
import {
  generateToken,
  csrfSynchronisedProtection,
} from "./middleware/csrf";

const app = express();

const PORT = Number(process.env.PORT) || 5000;
const MONGO_URI = process.env.MONGO_URI;
const SESSION_SECRET = process.env.SESSION_SECRET;
const FRONTEND_URL =
  process.env.FRONTEND_URL || "http://localhost:5173";

const isProduction = process.env.NODE_ENV === "production";

// Validate required environment variables
if (!MONGO_URI) {
  throw new Error("MONGO_URI is missing from your .env file");
}

if (!SESSION_SECRET || SESSION_SECRET.length < 32) {
  throw new Error(
    "SESSION_SECRET must be set to a strong secret of at least 32 characters"
  );
}

// Required when running behind a trusted reverse proxy in production
if (isProduction) {
  app.set("trust proxy", 1);
}

// CORS
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

// Parse JSON request bodies
app.use(express.json({ limit: "20kb" }));

// Session configuration
app.use(
  session({
    name: "todo.sid",
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,

    store: MongoStore.create({
      mongoUrl: MONGO_URI,
      collectionName: "sessions",
      ttl: 7 * 24 * 60 * 60,
    }),

    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    },
  })
);

// Health check
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    message: "Todo API is running",
  });
});

// CSRF token endpoint.
// This must be registered BEFORE csrfSynchronisedProtection.
app.get(
  "/api/csrf-token",
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = generateToken(req);
      res.json({ token });
    } catch (error) {
      next(error);
    }
  }
);

// CSRF protection for subsequent state-changing requests
app.use(csrfSynchronisedProtection);

// Rate limit authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message: "Too many requests. Please try again later.",
  },
});

// API routes
app.use("/api/auth", authLimiter, authRouter);
app.use("/api/todos", todoRouter);

// Handle invalid CSRF tokens and other errors
app.use(
  (
    error: Error & { code?: string; status?: number },
    _req: Request,
    res: Response,
    _next: NextFunction
  ) => {
    if (error.code === "EBADCSRFTOKEN") {
      res.status(403).json({
        message: "Invalid CSRF token. Refresh the page and try again.",
      });
      return;
    }

    console.error(error);

    res.status(error.status || 500).json({
      message:
        error.status && error.status < 500
          ? error.message
          : "Internal server error",
    });
  }
);

// Start the server after connecting to MongoDB
async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

void startServer();