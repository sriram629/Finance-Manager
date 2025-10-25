if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger"); // Import your config

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make 'uploads' folder static
app.use("/uploads", express.static(path.join(__dirname, "/uploads")));

// --- API Routes ---
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/auth", require("./routes/auth"));
app.use("/api/user", require("./routes/user"));
app.use("/api/schedules", require("./routes/schedules"));
app.use("/api/expenses", require("./routes/expenses"));
app.use("/api/reports", require("./routes/reports"));

// TODO: Add Swagger Docs Endpoint
// app.use('/api/docs', ...);

// --- Error Handling Middleware ---
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
