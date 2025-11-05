if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const { protect } = require("./middleware/authMiddleware");

connectDB();

const app = express();

app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || "*",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/auth", require("./routes/auth"));

app.use("/api/user", protect, require("./routes/user"));
app.use("/api/schedules", protect, require("./routes/schedules"));
app.use("/api/expenses", protect, require("./routes/expenses"));
app.use("/api/reports", protect, require("./routes/reports"));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5050;

app.listen(PORT, () => {
  console.log(
    `✅ Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
  );
});
