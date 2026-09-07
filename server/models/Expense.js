const mongoose = require("mongoose");

const ExpenseSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    place: { type: String, required: true },
    category: { type: String },
    amount: { type: Number, required: true, min: 0, validate: Number.isFinite },
    receiptData: { type: Buffer, select: false },
    receiptMime: String,
    receiptUrl: { type: String },
    notes: { type: String },
  },
  {
    timestamps: true,
    toJSON: { transform: (doc, ret) => { delete ret.receiptData; return ret; } },
  }
);

ExpenseSchema.index({ user: 1, date: 1 });

module.exports = mongoose.model("Expense", ExpenseSchema);
