if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const path = require("path");
const cors = require("cors");
const connectDB = require("./config/db");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const { protect } = require("./middleware/authMiddleware");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const rateLimit = require("express-rate-limit");
const passport = require("./config/passport");


const app = express();
app.set("trust proxy", 1);
app.use(passport.initialize());
app.use(helmet());
app.use(
  cors({
    origin: (process.env.ALLOWED_ORIGINS || process.env.CLIENT_URL || "http://localhost:8080").split(",").map(value => value.trim()),
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());


if (process.env.SERVE_CLIENT !== "true") {
  app.get("/", (req, res) => res.send("Finance Manager API is running..."));
}

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: "Too many attempts, please try again in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    error: "Too many requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/auth", authLimiter, require("./routes/auth"));

app.use("/api/user", protect, apiLimiter, require("./routes/user"));
app.use("/api/schedules", protect, apiLimiter, require("./routes/schedules"));
app.use("/api/expenses", protect, apiLimiter, require("./routes/expenses"));
app.use("/api/reports", protect, apiLimiter, require("./routes/reports"));

if (process.env.SERVE_CLIENT === "true") {
  const clientDirectory = path.join(__dirname, "../client/dist");
  app.use("/api", notFound);
  app.use(express.static(clientDirectory, { index: false, dotfiles: "deny" }));
  app.get(["/", "/login", "/register", "/forgot-password", "/auth/callback", "/home", "/add-schedule", "/upload-schedule", "/expenses", "/reports", "/settings"], (req, res) => {
    res.set("Cache-Control", "no-store");
    res.sendFile(path.join(clientDirectory, "index.html"));
  });
}

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5050;

connectDB().then(() => app.listen(PORT, () => {
  console.log(
    `✅ Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
  );
}));
