const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { uploadReceipt } = require("../middleware/uploadMiddleware");
const Expense = require("../models/Expense");
const mongoose = require("mongoose");
const multer = require("multer");

router.get("/", protect, async (req, res, next) => {
  try {
    const { startDate, endDate, category } = req.query;
    let query = { user: req.user.id };
    const dateFilter = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate);
    }
    if (Object.keys(dateFilter).length > 0) {
      query.date = dateFilter;
    }
    if (category) {
      query.category = category;
    }

    const expenses = await Expense.find(query).sort({ date: "desc" });

    const summary = expenses.reduce(
      (acc, exp) => {
        acc.totalExpenses += exp.amount;
        const cat = exp.category || "Uncategorized";
        acc.byCategory[cat] = (acc.byCategory[cat] || 0) + exp.amount;
        return acc;
      },
      { totalExpenses: 0, byCategory: {} }
    );

    res.json({ success: true, expenses: expenses, summary: summary });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/",
  protect,
  uploadReceipt.single("receipt"),
  async (req, res, next) => {
    try {
      const { date, place, category, amount, notes } = req.body;
      if (!date || !place || !amount) {
        return res
          .status(400)
          .json({
            success: false,
            error: "Date, place, and amount are required",
          });
      }
      let receiptUrl = null;
      if (req.file) {
        receiptUrl = `/uploads/${req.file.filename}`;
      }
      const newExpense = new Expense({
        user: req.user.id,
        date: new Date(date),
        place,
        category,
        amount: Number(amount),
        receiptUrl,
        notes,
      });
      const savedExpense = await newExpense.save();
      res
        .status(201)
        .json({
          success: true,
          expense: savedExpense,
          message: "Expense added successfully",
        });
    } catch (error) {
      if (
        error.code === "LIMIT_FILE_SIZE" ||
        error instanceof multer.MulterError
      ) {
        return res.status(400).json({ success: false, error: error.message });
      }
      next(error);
    }
  }
);

router.put(
  "/:id",
  protect,
  uploadReceipt.single("receipt"),
  async (req, res, next) => {
    try {
      const expenseId = req.params.id;
      const userId = req.user.id;
      const { date, place, category, amount, notes } = req.body;
      if (!mongoose.Types.ObjectId.isValid(expenseId)) {
        return res
          .status(400)
          .json({ success: false, error: "Invalid expense ID format" });
      }
      const expense = await Expense.findOne({ _id: expenseId, user: userId });
      if (!expense) {
        return res
          .status(404)
          .json({
            success: false,
            error: "Expense not found or permission denied",
          });
      }
      if (date) expense.date = new Date(date);
      if (place) expense.place = place;
      if (category !== undefined) expense.category = category || null;
      if (amount) expense.amount = Number(amount);
      if (notes !== undefined) expense.notes = notes || null;
      if (req.file) {
        // TODO: Delete old file if expense.receiptUrl exists
        expense.receiptUrl = `/uploads/${req.file.filename}`;
      }
      const updatedExpense = await expense.save();
      res.json({
        success: true,
        expense: updatedExpense,
        message: "Expense updated successfully",
      });
    } catch (error) {
      if (
        error.code === "LIMIT_FILE_SIZE" ||
        error instanceof multer.MulterError
      ) {
        return res.status(400).json({ success: false, error: error.message });
      }
      next(error);
    }
  }
);

router.delete("/:id", protect, async (req, res, next) => {
  try {
    const expenseId = req.params.id;
    const userId = req.user.id;
    if (!mongoose.Types.ObjectId.isValid(expenseId)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid expense ID format" });
    }
    const expense = await Expense.findOne({ _id: expenseId, user: userId });
    if (!expense) {
      return res
        .status(404)
        .json({
          success: false,
          error: "Expense not found or permission denied",
        });
    }
    // TODO: Delete receipt file if expense.receiptUrl exists
    await expense.deleteOne();
    res.json({ success: true, message: "Expense deleted successfully" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
