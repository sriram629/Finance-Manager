// config/swagger.js
const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Personal Finance & Schedule Manager API",
      version: "1.0.0",
      description:
        "API documentation for the Express.js backend, as per BACKEND_SPECIFICATION.md",
    },
    servers: [
      {
        url:
          `https://finance-manager-server-m3o4.onrender.com/` ||
          `http://localhost:${process.env.PORT || 5000}`,
        description: "Development server",
      },
    ],
    // This part is crucial for authorizing protected endpoints in the UI
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Path to the API docs (your route files)
  apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
