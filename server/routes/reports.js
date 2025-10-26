const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const Schedule = require("../models/Schedule");
const Expense = require("../models/Expense");
const mongoose = require("mongoose");

const getPeriod = (period, startDate, endDate) => {
  let start, end;

  if (period === "month") {
    start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    end = new Date(start);
    end.setMonth(end.getMonth() + 1);
  } else if (period === "custom" && startDate && endDate) {
    start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
  } else {
    start = new Date();
    start.setDate(
      start.getDate() - start.getDay() + (start.getDay() === 0 ? -6 : 1)
    );
    start.setHours(0, 0, 0, 0);
    end = new Date(start);
    end.setDate(end.getDate() + 7);
  }
  return { start, end };
};

router.get("/dashboard", protect, async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const { period = "week", startDate, endDate } = req.query;
    const { start, end } = getPeriod(period, startDate, endDate);

    const schedules = await Schedule.find({
      user: userId,
      date: { $gte: start, $lt: end },
    });
    const expenses = await Expense.find({
      user: userId,
      date: { $gte: start, $lt: end },
    });

    const totalIncome = schedules.reduce((acc, s) => {
      if (s.scheduleType === "hourly" && s.hours && s.hourlyRate) {
        return acc + s.hours * s.hourlyRate;
      }
      return acc;
    }, 0);

    const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
    const netProfit = totalIncome - totalExpenses;

    const weeklyIncomeByDay = await Schedule.aggregate([
      {
        $match: {
          user: userId,
          date: { $gte: start, $lt: end },
          scheduleType: "hourly",
        },
      },
      {
        $project: {
          dayOfWeek: { $dayOfWeek: "$date" },
          calculatedPay: { $multiply: ["$hours", "$hourlyRate"] },
        },
      },
      {
        $group: {
          _id: "$dayOfWeek",
          income: { $sum: "$calculatedPay" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const dayMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weeklyIncomeChart = dayMap
      .map((day, index) => {
        const found = weeklyIncomeByDay.find((d) => d._id === index + 1);
        return { day: day, income: found ? found.income : 0 };
      })
      .slice(1)
      .concat(
        dayMap.map((day, index) => {
          const found = weeklyIncomeByDay.find((d) => d._id === index + 1);
          return { day: day, income: found ? found.income : 0 };
        })[0]
      );

    const expensesByCategory = await Expense.aggregate([
      { $match: { user: userId, date: { $gte: start, $lt: end } } },
      {
        $group: {
          _id: { $ifNull: ["$category", "Uncategorized"] },
          amount: { $sum: "$amount" },
        },
      },
      {
        $project: {
          name: "$_id",
          value: "$amount",
          _id: 0,
        },
      },
    ]);

    const monthlyTrend = [
      { week: "Week 1", income: 0, expenses: 0 },
      { week: "Week 2", income: 0, expenses: 0 },
      { week: "Week 3", income: 0, expenses: 0 },
      { week: "Week 4", income: 0, expenses: 0 },
    ];

    res.json({
      success: true,
      kpis: {
        totalIncome,
        monthlyIncome: 0,
        totalExpenses,
        netProfit,
      },
      charts: {
        weeklyIncomeByDay: weeklyIncomeChart,
        expensesByCategory,
        monthlyTrend,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/generate", protect, (req, res) => {
  res.json({
    success: true,
    message: "POST /reports/generate not implemented",
  });
});

router.get("/quick-export", protect, (req, res) => {
  res.json({
    success: true,
    message: "GET /reports/quick-export not implemented",
  });
});

module.exports = router;
