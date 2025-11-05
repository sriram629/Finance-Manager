const swaggerJsdoc = require("swagger-jsdoc");
require("dotenv").config();

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Personal Finance & Schedule Manager API",
      version: "1.0.0",
      description:
        "API documentation for the Personal Finance & Schedule Manager backend built using Express.js",
    },

    servers: [
      {
        url:
          process.env.SERVER_BASE_URL_DEPLOYED ||
          "https://finance-manager-server-m3o4.onrender.com",
        description: "Production / Render Server",
      },
      {
        url: process.env.SERVER_BASE_URL_LOCAL || "http://localhost:5050",
        description: "Local Development Server",
      },
    ],

    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Provide JWT token as: Bearer <token>",
        },
      },

      schemas: {
        ErrorAuth001: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            error: { type: "string", example: "Invalid credentials" },
            code: { type: "string", example: "AUTH_001" },
          },
        },
        ErrorAuth002: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            error: { type: "string", example: "Email already exists" },
            code: { type: "string", example: "AUTH_002" },
          },
        },
        ErrorAuth003: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            error: { type: "string", example: "Invalid OTP" },
            code: { type: "string", example: "AUTH_003" },
          },
        },
        ErrorAuth004: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            error: { type: "string", example: "OTP expired" },
            code: { type: "string", example: "AUTH_004" },
          },
        },
        ErrorAuth005: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            error: { type: "string", example: "Account not verified" },
            code: { type: "string", example: "AUTH_005" },
          },
        },
        ErrorAuth006: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            error: { type: "string", example: "Not authorized, no token" },
            code: { type: "string", example: "AUTH_006" },
          },
        },

        ValidationError: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            errors: {
              type: "array",
              items: { type: "object" },
              example: [{ field: "email", message: "Email is required" }],
            },
            code: { type: "string", example: "VAL_001" },
          },
        },

        Error404: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            error: { type: "string", example: "Resource not found" },
          },
        },

        Error500: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            error: { type: "string", example: "Internal server error" },
            code: { type: "string", example: "SRV_001" },
          },
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
