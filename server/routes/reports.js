const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const Schedule = require("../models/Schedule");
const Expense = require("../models/Expense");
const mongoose = require("mongoose");
const xlsx = require("xlsx");

const getPeriod = (period, startDate, endDate) => {
  let start, end;
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  switch (period) {
    case "month":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "last4weeks":
      end = new Date();
      end.setHours(23, 59, 59, 999);
      start = new Date();
      start.setDate(now.getDate() - 28 + 1);
      start.setHours(0, 0, 0, 0);
      break;
    case "custom":
      if (startDate && endDate) {
        start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
      } else {
        throw new Error("Custom date range requires start and end dates.");
      }
      break;
    case "week":
    default:
      start = new Date();
      start.setDate(
        start.getDate() - start.getDay() + (start.getDay() === 0 ? -6 : 1)
      );
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;
  }
  if (isNaN(start) || isNaN(end) || start > end) {
    throw new Error("Invalid date range specified");
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
      { $group: { _id: "$dayOfWeek", income: { $sum: "$calculatedPay" } } },
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
      { $project: { name: "$_id", value: "$amount", _id: 0 } },
    ]);

    const monthlyTrend = [
      { week: "Week 1", income: 0, expenses: 0 },
      { week: "Week 2", income: 0, expenses: 0 },
      { week: "Week 3", income: 0, expenses: 0 },
      { week: "Week 4", income: 0, expenses: 0 },
    ];

    res.json({
      success: true,
      kpis: { totalIncome, monthlyIncome: 0, totalExpenses, netProfit },
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

router.post("/generate", protect, async (req, res, next) => {
  try {
    const { reportType, format, period, startDate, endDate } = req.body;
    const userId = req.user.id;

    if (!reportType || !format || !period) {
      return res
        .status(400)
        .json({ success: false, error: "Missing required parameters" });
    }
    if (format === "pdf") {
      return res
        .status(400)
        .json({ success: false, error: "PDF format not supported." });
    }
    if (period === "custom" && (!startDate || !endDate)) {
      return res
        .status(400)
        .json({
          success: false,
          error: "Custom date range requires start and end dates.",
        });
    }

    const { start, end } = getPeriod(period, startDate, endDate);

    let dataToExport = [];
    let headers = [];
    let filename = `report_${reportType}_${period}_${
      start.toISOString().split("T")[0]
    }_to_${end.toISOString().split("T")[0]}`;

    if (reportType === "schedule" || reportType === "combined") {
      const schedules = await Schedule.find({
        user: userId,
        date: { $gte: start, $lte: end },
      })
        .sort({ date: "asc" })
        .lean();
      if (reportType === "schedule")
        headers = [
          "Date",
          "Day",
          "Type",
          "Hours",
          "Rate",
          "Monthly Salary",
          "Tag",
          "Notes",
          "Calculated Pay",
        ];

      schedules.forEach((s) => {
        let calculatedPay = 0;
        if (
          s.scheduleType === "hourly" &&
          typeof s.hours === "number" &&
          typeof s.hourlyRate === "number"
        ) {
          calculatedPay = s.hours * s.hourlyRate;
        } else if (
          s.scheduleType === "monthly" &&
          typeof s.monthlySalary === "number"
        ) {
          calculatedPay = s.monthlySalary;
        }
        dataToExport.push({
          "Report Section": "Schedule",
          Date: s.date.toISOString().split("T")[0],
          Day: s.dayOfWeek,
          Type: s.scheduleType,
          Hours: s.hours ?? "",
          Rate: s.hourlyRate ?? "",
          "Monthly Salary": s.monthlySalary ?? "",
          Tag: s.tag ?? "",
          Notes: s.notes ?? "",
          "Calculated Pay": calculatedPay.toFixed(2),
        });
      });
    }

    if (reportType === "expenses" || reportType === "combined") {
      const expenses = await Expense.find({
        user: userId,
        date: { $gte: start, $lte: end },
      })
        .sort({ date: "asc" })
        .lean();
      if (reportType === "expenses")
        headers = ["Date", "Place", "Category", "Amount", "Notes"];

      expenses.forEach((e) => {
        dataToExport.push({
          "Report Section": "Expense",
          Date: e.date.toISOString().split("T")[0],
          Place: e.place,
          Category: e.category ?? "Uncategorized",
          Amount: e.amount.toFixed(2),
          Notes: e.notes ?? "",
          ...(reportType === "combined"
            ? {
                Day: "",
                Type: "",
                Hours: "",
                Rate: "",
                "Monthly Salary": "",
                Tag: "",
                "Calculated Pay": "",
              }
            : {}),
        });
      });
    }

    if (reportType === "combined") {
      headers = [
        "Report Section",
        "Date",
        "Day",
        "Type",
        "Hours",
        "Rate",
        "Monthly Salary",
        "Tag",
        "Notes",
        "Place",
        "Category",
        "Amount",
        "Calculated Pay",
      ];
      dataToExport = dataToExport.map((item) => ({
        "Report Section": item["Report Section"],
        Date: item["Date"],
        Day: item["Day"],
        Type: item["Type"],
        Hours: item["Hours"],
        Rate: item["Rate"],
        "Monthly Salary": item["Monthly Salary"],
        Tag: item["Tag"],
        Notes: item["Notes"],
        Place: item["Place"],
        Category: item["Category"],
        Amount: item["Amount"],
        "Calculated Pay": item["Calculated Pay"],
      }));
      dataToExport.sort(
        (a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime()
      );
    }

    if (dataToExport.length === 0) {
      return res
        .status(404)
        .json({
          success: false,
          error: "No data found for the selected criteria.",
        });
    }

    if (reportType !== "combined") {
      dataToExport = dataToExport.map(
        ({ "Report Section": _, ...rest }) => rest
      );
    } else {
      const finalHeaders = [
        "Report Section",
        "Date",
        "Day",
        "Type",
        "Hours",
        "Rate",
        "Monthly Salary",
        "Tag",
        "Notes",
        "Place",
        "Category",
        "Amount",
        "Calculated Pay",
      ];
      dataToExport = dataToExport.map((item) => {
        const orderedItem = {};
        finalHeaders.forEach((header) => {
          orderedItem[header] = item[header] ?? "";
        });
        return orderedItem;
      });
      headers = finalHeaders;
    }

    const worksheet = xlsx.utils.json_to_sheet(dataToExport, {
      header: headers.length > 0 ? headers : undefined,
    });
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "ReportData");

    let fileBuffer;
    let contentType;
    let fileExtension;

    if (format === "xlsx") {
      fileBuffer = xlsx.write(workbook, { bookType: "xlsx", type: "buffer" });
      contentType =
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      fileExtension = "xlsx";
    } else {
      fileBuffer = xlsx.write(workbook, { bookType: "csv", type: "buffer" });
      contentType = "text/csv";
      fileExtension = "csv";
    }

    filename += `.${fileExtension}`;

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(fileBuffer);
  } catch (error) {
    console.error("Error generating report:", error);
    if (
      error.message.includes("Invalid date range") ||
      error.message.includes("Custom date range requires")
    ) {
      if (!res.headersSent) {
        return res.status(400).json({ success: false, error: error.message });
      }
    }
    if (!res.headersSent) {
      next(error);
    }
  }
});

router.get("/quick-export", protect, (req, res) => {
  res.json({
    success: true,
    message: "GET /quick-export not implemented",
  });
});

module.exports = router;
