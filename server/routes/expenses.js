const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { uploadReceipt } = require("../middleware/uploadMiddleware");
const Expense = require("../models/Expense");
const mongoose = require("mongoose");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

/**
 * @swagger
 * tags:
 *   name: Expenses
 *   description: Manage user expenses
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Expense:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "678abcd1234ef56789012345"
 *         user:
 *           type: string
 *           example: "678abcd1234ef56789098765"
 *         date:
 *           type: string
 *           format: date
 *           example: "2025-01-05"
 *         place:
 *           type: string
 *           example: "Walmart"
 *         category:
 *           type: string
 *           example: "Groceries"
 *         amount:
 *           type: number
 *           example: 29.99
 *         receiptUrl:
 *           type: string
 *           example: "/uploads/receipt123.jpg"
 *         notes:
 *           type: string
 *           example: "Weekly groceries"
 *
 */

/**
 * @swagger
 * /api/expenses:
 *   get:
 *     summary: Get all expenses for the logged-in user
 *     tags: [Expenses]
 *     description: Fetch all expenses with optional filters by date range and category.
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter starting from this date.
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter until this date.
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter expenses by category.
 *     responses:
 *       200:
 *         description: List of expenses and summary totals.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 expenses:
 *                   type: array
 *                   items:
 *                     $ref: "#/components/schemas/Expense"
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalExpenses:
 *                       type: number
 *                     byCategory:
 *                       type: object
 *       401:
 *         $ref: "#/components/schemas/ErrorAuth006"
 *       500:
 *         $ref: "#/components/schemas/Error500"
 */

/**
 * @swagger
 * /api/expenses:
 *   post:
 *     summary: Create a new expense
 *     tags: [Expenses]
 *     description: Add a new expense with optional receipt image upload.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               place:
 *                 type: string
 *               category:
 *                 type: string
 *               amount:
 *                 type: number
 *               notes:
 *                 type: string
 *               receipt:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Expense added successfully.
 *       400:
 *         description: Validation or file upload error.
 *       401:
 *         $ref: "#/components/schemas/ErrorAuth006"
 *       500:
 *         $ref: "#/components/schemas/Error500"
 */

/**
 * @swagger
 * /api/expenses/{id}:
 *   put:
 *     summary: Update an existing expense
 *     tags: [Expenses]
 *     description: Update expense fields and optionally replace the receipt file.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Expense ID
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *               place:
 *                 type: string
 *               category:
 *                 type: string
 *               amount:
 *                 type: number
 *               notes:
 *                 type: string
 *               receipt:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Expense updated successfully.
 *       400:
 *         description: Invalid ID or upload error.
 *       401:
 *         $ref: "#/components/schemas/ErrorAuth006"
 *       404:
 *         description: Expense not found or unauthorized.
 *       500:
 *         $ref: "#/components/schemas/Error500"
 */

/**
 * @swagger
 * /api/expenses/{id}:
 *   delete:
 *     summary: Delete an expense
 *     tags: [Expenses]
 *     description: Remove the expense and delete its receipt file if exists.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Expense ID
 *     responses:
 *       200:
 *         description: Expense deleted successfully.
 *       400:
 *         description: Invalid ID format.
 *       401:
 *         $ref: "#/components/schemas/ErrorAuth006"
 *       404:
 *         description: Expense not found or unauthorized.
 *       500:
 *         $ref: "#/components/schemas/Error500"
 */

const deleteReceiptFile = (receiptUrl) => {
  if (!receiptUrl) return;
  const filePath = path.join(process.cwd(), receiptUrl);
  fs.unlink(filePath, (err) => {
    if (err) console.error(`Failed to delete receipt file: ${filePath}`, err);
    else console.log(`Deleted receipt file: ${filePath}`);
  });
};

router.get("/", protect, async (req, res, next) => {
  try {
    const { startDate, endDate, category } = req.query;
    let query = { user: req.user.id };
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
    if (Object.keys(dateFilter).length > 0) query.date = dateFilter;
    if (category) query.category = category;

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

    res.json({ success: true, expenses, summary });
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
        return res.status(400).json({
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
      res.status(201).json({
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

      if (!mongoose.Types.ObjectId.isValid(expenseId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid expense ID format",
        });
      }

      const expense = await Expense.findOne({ _id: expenseId, user: userId });
      if (!expense) {
        return res.status(404).json({
          success: false,
          error: "Expense not found or permission denied",
        });
      }

      const oldReceiptUrl = expense.receiptUrl;

      const { date, place, category, amount, notes } = req.body;
      if (date) expense.date = new Date(date);
      if (place) expense.place = place;
      if (category !== undefined) expense.category = category || null;
      if (amount) expense.amount = Number(amount);
      if (notes !== undefined) expense.notes = notes;

      if (req.file) {
        expense.receiptUrl = `/uploads/${req.file.filename}`;
        if (oldReceiptUrl) deleteReceiptFile(oldReceiptUrl);
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
      return res.status(400).json({
        success: false,
        error: "Invalid expense ID format",
      });
    }

    const expense = await Expense.findOne({ _id: expenseId, user: userId });
    if (!expense) {
      return res.status(404).json({
        success: false,
        error: "Expense not found or permission denied",
      });
    }

    if (expense.receiptUrl) deleteReceiptFile(expense.receiptUrl);

    await expense.deleteOne();
    res.json({
      success: true,
      message: "Expense deleted successfully",
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
