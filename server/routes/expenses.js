const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { uploadReceipt } = require("../middleware/uploadMiddleware");

// 14. GET /api/expenses
router.get("/", protect, (req, res) => {
  // TODO: Implement GET /api/expenses logic
  res.json({ success: true, message: "GET /expenses not implemented" });
});

// 15. POST /api/expenses
router.post("/", protect, uploadReceipt.single("receipt"), (req, res) => {
  // TODO: Implement POST /api/expenses logic
  // req.body will contain the JSON data
  // req.file will contain the uploaded receipt
  res.json({
    success: true,
    message: "POST /expenses not implemented",
    file: req.file,
    body: req.body,
  });
});

// 16. PUT /api/expenses/:id
router.put("/:id", protect, uploadReceipt.single("receipt"), (req, res) => {
  // TODO: Implement PUT /api/expenses/:id logic
  res.json({
    success: true,
    message: `PUT /expenses/${req.params.id} not implemented`,
  });
});

// 17. DELETE /api/expenses/:id
router.delete("/:id", protect, (req, res) => {
  // TODO: Implement DELETE /api/expenses/:id logic
  res.json({
    success: true,
    message: `DELETE /expenses/${req.params.id} not implemented`,
  });
});

module.exports = router;
