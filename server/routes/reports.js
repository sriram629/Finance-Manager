const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const Schedule = require("../models/Schedule");
const Expense = require("../models/Expense");
const mongoose = require("mongoose");
const xlsx = require("xlsx");
const PDFDocument = require("pdfkit");

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Manage user reports
 */

/**
 * @swagger
 * /api/user/dashboard:
 *   get:
 *     summary: Get user dashboard data
 *     description: Fetches schedules, expenses, KPIs, and chart data for a given period.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: period
 *         in: query
 *         schema:
 *           type: string
 *           enum: [week, month, last4weeks, custom]
 *         description: Time period for the dashboard
 *       - name: startDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *         description: Custom start date (required if period=custom)
 *       - name: endDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *         description: Custom end date (required if period=custom)
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *       400:
 *         description: Invalid parameters
 */

/**
 * @swagger
 * /api/user/generate:
 *   post:
 *     summary: Generate a report
 *     description: Generate PDF, XLSX, or CSV reports for schedules, expenses, or combined data.
 *     tags:
 *       - Reports
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reportType
 *               - format
 *               - period
 *             properties:
 *               reportType:
 *                 type: string
 *                 enum: [schedule, expenses, combined]
 *               format:
 *                 type: string
 *                 enum: [pdf, xlsx, csv]
 *               period:
 *                 type: string
 *                 enum: [week, month, last4weeks, custom]
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Report generated successfully
 *       400:
 *         description: Bad request / missing parameters
 *       404:
 *         description: No data found
 */

/**
 * @swagger
 * /api/user/quick-export:
 *   get:
 *     summary: Quick export report
 *     description: Export predefined reports (weekly, monthly, or expense analysis) as XLSX or CSV.
 *     tags:
 *       - Reports
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: preset
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *           enum: [weekly-summary, monthly-overview, expense-analysis]
 *       - name: format
 *         in: query
 *         schema:
 *           type: string
 *           enum: [xlsx, csv]
 *       - name: reportType
 *         in: query
 *         schema:
 *           type: string
 *           enum: [schedule, expenses, combined]
 *     responses:
 *       200:
 *         description: Quick export generated successfully
 *       400:
 *         description: Bad request / invalid preset
 */

/**
 * @swagger
 * /api/user/summary:
 *   get:
 *     summary: Weekly and monthly summary
 *     description: Fetch weekly and monthly income and net profit summary for the user.
 *     tags:
 *       - Summary
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Summary retrieved successfully
 *       400:
 *         description: Bad request
 */

const getPeriod = (period, startDate, endDate) => {
  let start, end;
  const now = new Date();

  const currentUTCDate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const currentUTCDay = currentUTCDate.getUTCDay();

  switch (period) {
    case "month":
      start = new Date(
        Date.UTC(
          currentUTCDate.getUTCFullYear(),
          currentUTCDate.getUTCMonth(),
          1
        )
      );
      end = new Date(
        Date.UTC(
          currentUTCDate.getUTCFullYear(),
          currentUTCDate.getUTCMonth() + 1,
          0
        )
      );
      end.setUTCHours(23, 59, 59, 999);
      break;
    case "last4weeks":
      end = new Date(currentUTCDate);
      end.setUTCHours(23, 59, 59, 999);
      start = new Date(currentUTCDate);
      start.setUTCDate(currentUTCDate.getUTCDate() - 28 + 1);
      break;
    case "custom":
      if (startDate && endDate) {
        start = new Date(startDate);
        start.setUTCHours(0, 0, 0, 0);
        end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999);
      } else {
        throw new Error("Custom date range requires start and end dates.");
      }
      break;
    case "week":
    default:
      const dayOffset = currentUTCDay === 0 ? -6 : 1;
      start = new Date(currentUTCDate);
      start.setUTCDate(currentUTCDate.getUTCDate() - currentUTCDay + dayOffset);

      end = new Date(start);
      end.setUTCDate(start.getUTCDate() + 6);
      end.setUTCHours(23, 59, 59, 999);
      break;
  }
  if (isNaN(start) || isNaN(end) || start > end) {
    throw new Error("Invalid date range specified");
  }
  return { start, end };
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value ?? 0);
};

const formatDate = (date) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-US", { timeZone: "UTC" });
};

const generatePdfHeader = (doc, reportType, period, start, end) => {
  doc
    .fontSize(18)
    .font("Helvetica-Bold")
    .text(
      `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`,
      { align: "center" }
    );
  doc.fontSize(12).font("Helvetica").moveDown(0.5);

  let dateString;
  if (period === "custom") {
    dateString = `${formatDate(start)} to ${formatDate(end)}`;
  } else {
    dateString = `Period: ${
      period.charAt(0).toUpperCase() + period.slice(1)
    } (${formatDate(start)} to ${formatDate(end)})`;
  }
  doc.text(dateString, { align: "center" });
  doc.moveDown(2);
};

const checkAddPage = (doc, yPos) => {
  if (yPos > 700) {
    doc.addPage();
    return doc.page.margins.top;
  }
  return yPos;
};

const generateScheduleTable = (doc, schedules) => {
  let y = doc.y;
  doc.font("Helvetica-Bold");
  doc.fontSize(14).text("Schedules & Income", { underline: true });
  doc.moveDown(1);
  y = doc.y;
  y = checkAddPage(doc, y);

  const rowHeight = 25;
  const col1 = 50;
  const col2 = 120;
  const col3 = 200;
  const col4 = 250;
  const col5 = 300;
  const col6 = 370;
  const col7 = 450;

  doc.fontSize(10);
  doc.text("Date", col1, y);
  doc.text("Day", col2, y);
  doc.text("Type", col3, y);
  doc.text("Hours", col4, y, { width: 50, align: "right" });
  doc.text("Rate", col5, y, { width: 60, align: "right" });
  doc.text("Tag", col6, y);
  doc.text("Total Pay", col7, y, { width: 80, align: "right" });
  doc.moveDown(0.5);
  y = doc.y;
  doc
    .strokeColor("#aaaaaa")
    .lineWidth(0.5)
    .moveTo(col1, y)
    .lineTo(doc.page.width - col1, y)
    .stroke();
  y += 5;

  doc.font("Helvetica");
  let totalIncome = 0;

  schedules.forEach((s) => {
    y = checkAddPage(doc, y);
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
      calculatedPay = s.monthlySalary / 4;
    }

    totalIncome += calculatedPay;

    doc.text(formatDate(s.date), col1, y);
    doc.text(s.dayOfWeek, col2, y);
    doc.text(s.scheduleType, col3, y);
    doc.text(s.hours?.toString() ?? "N/A", col4, y, {
      width: 50,
      align: "right",
    });
    doc.text(s.hourlyRate?.toString() ?? "N/A", col5, y, {
      width: 60,
      align: "right",
    });
    doc.text(s.tag ?? "", col6, y, { width: 70, ellipsis: true });
    doc.text(formatCurrency(calculatedPay), col7, y, {
      width: 80,
      align: "right",
    });
    y += rowHeight;
  });

  y = checkAddPage(doc, y);
  doc
    .strokeColor("#000000")
    .lineWidth(1)
    .moveTo(col1, y)
    .lineTo(doc.page.width - col1, y)
    .stroke();
  y += 5;
  doc.font("Helvetica-Bold");
  doc.text("Total Income:", col6, y, { width: 80, align: "left" });
  doc.text(formatCurrency(totalIncome), col7, y, { width: 80, align: "right" });
  doc.y = y + rowHeight;
};

const generateExpenseTable = (doc, expenses) => {
  let y = checkAddPage(doc, doc.y);
  doc.font("Helvetica-Bold");
  doc.fontSize(14).text("Expenses", { underline: true });
  doc.moveDown(1);
  y = doc.y;
  y = checkAddPage(doc, y);

  const rowHeight = 25;
  const col1 = 50;
  const col2 = 120;
  const col3 = 250;
  const col4 = 450;

  doc.fontSize(10);
  doc.text("Date", col1, y);
  doc.text("Place/Vendor", col2, y);
  doc.text("Category", col3, y);
  doc.text("Amount", col4, y, { width: 80, align: "right" });
  doc.moveDown(0.5);
  y = doc.y;
  doc
    .strokeColor("#aaaaaa")
    .lineWidth(0.5)
    .moveTo(col1, y)
    .lineTo(doc.page.width - col1, y)
    .stroke();
  y += 5;

  doc.font("Helvetica");
  let totalExpenses = 0;

  expenses.forEach((e) => {
    y = checkAddPage(doc, y);
    totalExpenses += e.amount;
    doc.text(formatDate(e.date), col1, y);
    doc.text(e.place, col2, y, { width: 120, ellipsis: true });
    doc.text(e.category ?? "Uncategorized", col3, y);
    doc.text(formatCurrency(e.amount), col4, y, { width: 80, align: "right" });
    y += rowHeight;
  });

  y = checkAddPage(doc, y);
  doc
    .strokeColor("#000000")
    .lineWidth(1)
    .moveTo(col1, y)
    .lineTo(doc.page.width - col1, y)
    .stroke();
  y += 5;
  doc.font("Helvetica-Bold");
  doc.text("Total Expenses:", col3, y, { width: 100, align: "right" });
  doc.text(formatCurrency(totalExpenses), col4, y, {
    width: 80,
    align: "right",
  });
  doc.y = y + rowHeight;
};

router.get("/dashboard", protect, async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const { period = "week", startDate, endDate } = req.query;
    const { start, end } = getPeriod(period, startDate, endDate);

    const schedules = await Schedule.find({
      user: userId,
      date: { $gte: start, $lte: end },
    });
    const expenses = await Expense.find({
      user: userId,
      date: { $gte: start, $lte: end },
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
          date: { $gte: start, $lte: end },
          scheduleType: "hourly",
        },
      },
      {
        $project: {
          dayOfWeek: { $dayOfWeek: { date: "$date", timezone: "UTC" } },
          calculatedPay: { $multiply: ["$hours", "$hourlyRate"] },
        },
      },
      { $group: { _id: "$dayOfWeek", income: { $sum: "$calculatedPay" } } },
      { $sort: { _id: 1 } },
    ]);

    const dayMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const mappedData = dayMap.map((day, index) => {
      const found = weeklyIncomeByDay.find((d) => d._id === index + 1);
      return { day: day, income: found ? found.income : 0 };
    });
    const weeklyIncomeChart = mappedData.slice(1).concat(mappedData[0]);

    const expensesByCategory = await Expense.aggregate([
      { $match: { user: userId, date: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { $ifNull: ["$category", "Uncategorized"] },
          amount: { $sum: "$amount" },
        },
      },
      { $project: { name: "$_id", value: "$amount", _id: 0 } },
    ]);

    const scheduleTrend = await Schedule.aggregate([
      {
        $match: {
          user: userId,
          date: { $gte: start, $lte: end },
          scheduleType: "hourly",
        },
      },
      {
        $project: {
          week: {
            $floor: {
              $divide: [
                { $subtract: ["$date", start] },
                1000 * 60 * 60 * 24 * 7,
              ],
            },
          },
          calculatedPay: { $multiply: ["$hours", "$hourlyRate"] },
        },
      },
      { $group: { _id: "$week", income: { $sum: "$calculatedPay" } } },
      { $sort: { _id: 1 } },
    ]);

    const expenseTrend = await Expense.aggregate([
      { $match: { user: userId, date: { $gte: start, $lte: end } } },
      {
        $project: {
          week: {
            $floor: {
              $divide: [
                { $subtract: ["$date", start] },
                1000 * 60 * 60 * 24 * 7,
              ],
            },
          },
          amount: "$amount",
        },
      },
      { $group: { _id: "$week", expenses: { $sum: "$amount" } } },
      { $sort: { _id: 1 } },
    ]);

    const numWeeks =
      period === "month" || period === "last4weeks" || period === "custom"
        ? Math.ceil(
            (end.getTime() - start.getTime() + 1) / (1000 * 60 * 60 * 24 * 7)
          )
        : 1;
    const monthlyTrend = [];
    for (let i = 0; i < numWeeks; i++) {
      const incomeData = scheduleTrend.find((s) => s._id === i);
      const expenseData = expenseTrend.find((e) => e._id === i);
      monthlyTrend.push({
        week: `Week ${i + 1}`,
        income: incomeData ? incomeData.income : 0,
        expenses: expenseData ? expenseData.expenses : 0,
      });
    }

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

const generateReportData = async (
  userId,
  reportType,
  format,
  period,
  startDate,
  endDate
) => {
  const { start, end } = getPeriod(period, startDate, endDate);

  let schedules = [];
  let expenses = [];
  let dataToExport = [];
  let headers = [];

  if (reportType === "schedule" || reportType === "combined") {
    schedules = await Schedule.find({
      user: userId,
      date: { $gte: start, $lte: end },
    })
      .sort({ date: "asc" })
      .lean();
  }
  if (reportType === "expenses" || reportType === "combined") {
    expenses = await Expense.find({
      user: userId,
      date: { $gte: start, $lte: end },
    })
      .sort({ date: "asc" })
      .lean();
  }

  if (schedules.length === 0 && expenses.length === 0) {
    return { error: "No data found for the selected criteria.", status: 404 };
  }

  if (reportType === "schedule") {
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
    dataToExport = schedules.map((s) => {
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
      return {
        Date: s.date.toISOString().split("T")[0],
        Day: s.dayOfWeek,
        Type: s.scheduleType,
        Hours: s.hours ?? "",
        Rate: s.hourlyRate ?? "",
        "Monthly Salary": s.monthlySalary ?? "",
        Tag: s.tag ?? "",
        Notes: s.notes ?? "",
        "Calculated Pay": calculatedPay.toFixed(2),
      };
    });
  } else if (reportType === "expenses") {
    headers = ["Date", "Place", "Category", "Amount", "Notes"];
    dataToExport = expenses.map((e) => ({
      Date: e.date.toISOString().split("T")[0],
      Place: e.place,
      Category: e.category ?? "Uncategorized",
      Amount: e.amount.toFixed(2),
      Notes: e.notes ?? "",
    }));
  } else if (reportType === "combined") {
    headers = [
      "Section",
      "Date",
      "Day",
      "Type",
      "Hours",
      "Rate",
      "Salary",
      "Tag",
      "Notes",
      "Place",
      "Category",
      "Amount",
      "Pay",
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
        Section: "Schedule",
        Date: s.date.toISOString().split("T")[0],
        Day: s.dayOfWeek,
        Type: s.scheduleType,
        Hours: s.hours ?? "",
        Rate: s.hourlyRate ?? "",
        Salary: s.monthlySalary ?? "",
        Tag: s.tag ?? "",
        Notes: s.notes ?? "",
        Place: "",
        Category: "",
        Amount: "",
        Pay: calculatedPay.toFixed(2),
      });
    });
    expenses.forEach((e) => {
      dataToExport.push({
        Section: "Expense",
        Date: e.date.toISOString().split("T")[0],
        Day: "",
        Type: "",
        Hours: "",
        Rate: "",
        Salary: "",
        Tag: "",
        Notes: e.notes ?? "",
        Place: e.place,
        Category: e.category ?? "Uncategorized",
        Amount: e.amount.toFixed(2),
        Pay: "",
      });
    });
    dataToExport.sort(
      (a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime()
    );
    const finalHeaders = [
      "Section",
      "Date",
      "Day",
      "Type",
      "Hours",
      "Rate",
      "Salary",
      "Tag",
      "Notes",
      "Place",
      "Category",
      "Amount",
      "Pay",
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

  return { dataToExport, headers, schedules, expenses, start, end };
};

router.post("/generate", protect, async (req, res, next) => {
  try {
    const { reportType, format, period, startDate, endDate } = req.body;
    const userId = req.user.id;

    if (!reportType || !format || !period) {
      return res
        .status(400)
        .json({ success: false, error: "Missing required parameters" });
    }
    if (period === "custom" && (!startDate || !endDate)) {
      return res.status(400).json({
        success: false,
        error: "Custom date range requires start and end dates.",
      });
    }

    const {
      dataToExport,
      headers,
      schedules,
      expenses,
      start,
      end,
      error,
      status,
    } = await generateReportData(
      userId,
      reportType,
      format,
      period,
      startDate,
      endDate
    );

    if (error) {
      return res.status(status).json({ success: false, error: error });
    }

    let filename = `report_${reportType}_${period}_${
      start.toISOString().split("T")[0]
    }_to_${end.toISOString().split("T")[0]}`;

    if (format === "pdf") {
      filename += ".pdf";
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );

      const doc = new PDFDocument({ margin: 30, size: "A4" });
      doc.pipe(res);

      generatePdfHeader(doc, reportType, period, start, end);

      let totalIncome = 0;
      let totalExpenses = 0;

      if (reportType === "schedule" || reportType === "combined") {
        totalIncome = schedules.reduce((acc, s) => {
          if (s.scheduleType === "hourly" && s.hours && s.hourlyRate) {
            return acc + s.hours * s.hourlyRate;
          }
          return acc;
        }, 0);
        if (schedules.length > 0) generateScheduleTable(doc, schedules);
      }

      if (reportType === "expenses" || reportType === "combined") {
        totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
        if (expenses.length > 0) generateExpenseTable(doc, expenses);
      }

      if (reportType === "combined") {
        if (doc.y > 650 || (schedules.length > 0 && expenses.length > 0))
          doc.addPage();
        doc.moveDown(2);
        doc
          .fontSize(16)
          .font("Helvetica-Bold")
          .text("Financial Summary", { align: "left" });
        doc.moveDown(1.5);
        doc.fontSize(12);
        doc.text(`Total Income: ${formatCurrency(totalIncome)}`, {
          align: "left",
        });
        doc.moveDown(0.5);
        doc.text(`Total Expenses: ${formatCurrency(totalExpenses)}`, {
          align: "left",
        });
        doc.moveDown(0.5);
        doc.font("Helvetica-Bold");
        doc.text(`Net Profit: ${formatCurrency(totalIncome - totalExpenses)}`, {
          align: "left",
        });
      }
      doc.end();
    } else {
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
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );
      res.send(fileBuffer);
    }
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

router.get("/quick-export", protect, async (req, res, next) => {
  try {
    const { preset, format = "xlsx", reportType = "combined" } = req.query;
    const userId = req.user.id;

    if (!preset) {
      return res
        .status(400)
        .json({ success: false, error: "Preset is required." });
    }

    let period;
    let effectiveReportType = reportType;
    switch (preset) {
      case "weekly-summary":
        period = "week";
        effectiveReportType = "combined";
        break;
      case "monthly-overview":
        period = "month";
        effectiveReportType = "combined";
        break;
      case "expense-analysis":
        period = "month";
        effectiveReportType = "expenses";
        break;
      default:
        return res
          .status(400)
          .json({ success: false, error: "Invalid preset." });
    }

    const { start, end } = getPeriod(period);
    const { dataToExport, headers, error, status } = await generateReportData(
      userId,
      effectiveReportType,
      format,
      period,
      start.toISOString().split("T")[0],
      end.toISOString().split("T")[0]
    );

    if (error) {
      return res.status(status).json({ success: false, error: error });
    }

    let filename = `quick_export_${preset}_${
      new Date().toISOString().split("T")[0]
    }`;
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
    console.error("Error generating quick export:", error);
    if (!res.headersSent) {
      next(error);
    }
  }
});

router.get("/summary", protect, async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const { start: weekStart, end: weekEnd } = getPeriod("week");
    const { start: monthStart, end: monthEnd } = getPeriod("month");

    const weekSchedules = await Schedule.find({
      user: userId,
      date: { $gte: weekStart, $lte: weekEnd },
    });
    const weekExpenses = await Expense.find({
      user: userId,
      date: { $gte: weekStart, $lte: weekEnd },
    });

    const monthSchedules = await Schedule.find({
      user: userId,
      date: { $gte: monthStart, $lte: monthEnd },
    });
    const monthExpenses = await Expense.find({
      user: userId,
      date: { $gte: monthStart, $lte: monthEnd },
    });

    const weekIncome = weekSchedules.reduce((acc, s) => {
      if (s.scheduleType === "hourly" && s.hours && s.hourlyRate) {
        return acc + s.hours * s.hourlyRate;
      }
      return acc;
    }, 0);
    const weekExpensesTotal = weekExpenses.reduce(
      (acc, e) => acc + e.amount,
      0
    );

    const monthIncome = monthSchedules.reduce((acc, s) => {
      if (s.scheduleType === "hourly" && s.hours && s.hourlyRate) {
        return acc + s.hours * s.hourlyRate;
      }
      return acc;
    }, 0);
    const monthExpensesTotal = monthExpenses.reduce(
      (acc, e) => acc + e.amount,
      0
    );

    res.json({
      success: true,
      summary: {
        weekIncome: weekIncome,
        weekNetProfit: weekIncome - weekExpensesTotal,
        monthIncome: monthIncome,
        monthNetProfit: monthIncome - monthExpensesTotal,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
