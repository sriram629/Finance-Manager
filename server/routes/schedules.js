const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { uploadSchedule } = require("../middleware/uploadMiddleware");
const mongoose = require("mongoose");
const Schedule = require("../models/Schedule");
const xlsx = require("xlsx");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");

const uploadCache = new Map();

/**
 * @swagger
 * tags:
 *   name: Schedules
 *   description: Schedule management and uploads
 */

/**
 * @swagger
 * /api/user/schedules:
 *   get:
 *     summary: Get all schedules
 *     description: Retrieve user schedules with optional date range and future schedule filtering.
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: startDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date filter (YYYY-MM-DD)
 *       - name: endDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *         description: End date filter (YYYY-MM-DD)
 *       - name: includeFuture
 *         in: query
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Include future schedules
 *     responses:
 *       200:
 *         description: List of schedules with summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 schedules:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Schedule'
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalHours:
 *                       type: number
 *                     totalPay:
 *                       type: number
 *                     daysWorked:
 *                       type: number
 */

/**
 * @swagger
 * /api/user/schedules:
 *   post:
 *     summary: Create new schedule(s)
 *     description: Add a new schedule. Supports repeating weekly schedules on specific weekdays.
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               scheduleType:
 *                 type: string
 *                 enum: [hourly, monthly]
 *               hours:
 *                 type: number
 *               hourlyRate:
 *                 type: number
 *               monthlySalary:
 *                 type: number
 *               tag:
 *                 type: string
 *               notes:
 *                 type: string
 *               repeatWeekly:
 *                 type: boolean
 *               repeatWeekdays:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Schedule(s) created successfully
 *       400:
 *         description: Validation errors
 */

/**
 * @swagger
 * /api/user/schedules/{id}:
 *   put:
 *     summary: Update schedule
 *     description: Update schedule fields by ID.
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Schedule ID
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               scheduleType:
 *                 type: string
 *                 enum: [hourly, monthly]
 *               hours:
 *                 type: number
 *               hourlyRate:
 *                 type: number
 *               monthlySalary:
 *                 type: number
 *               tag:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Schedule updated successfully
 *       400:
 *         description: Invalid ID or data
 *       404:
 *         description: Schedule not found
 */

/**
 * @swagger
 * /api/user/schedules/{id}:
 *   delete:
 *     summary: Delete schedule
 *     description: Delete a schedule by ID.
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Schedule ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Schedule deleted successfully
 *       400:
 *         description: Invalid schedule ID
 *       404:
 *         description: Schedule not found
 */

/**
 * @swagger
 * /api/user/schedules/upload:
 *   post:
 *     summary: Upload schedule Excel file
 *     description: Upload an XLSX file to preview schedules before confirming import.
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: File preview generated successfully
 *       400:
 *         description: Validation errors or empty file
 */

/**
 * @swagger
 * /api/user/schedules/confirm-upload:
 *   post:
 *     summary: Confirm schedule upload
 *     description: Confirm and import valid schedule rows from a previous file upload session.
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tempFileId:
 *                 type: string
 *               rowsToImport:
 *                 type: array
 *                 items:
 *                   type: number
 *     responses:
 *       200:
 *         description: Schedules imported successfully
 *       400:
 *         description: No valid rows selected
 *       404:
 *         description: Upload session expired
 */

/**
 * @swagger
 * /api/user/schedules/template:
 *   get:
 *     summary: Download schedule template
 *     description: Download an Excel template for schedule uploads.
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: XLSX file with template
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Schedule:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         user:
 *           type: string
 *         date:
 *           type: string
 *           format: date
 *         dayOfWeek:
 *           type: string
 *         scheduleType:
 *           type: string
 *           enum: [hourly, monthly]
 *         hours:
 *           type: number
 *         hourlyRate:
 *           type: number
 *         monthlySalary:
 *           type: number
 *         tag:
 *           type: string
 *         notes:
 *           type: string
 *         isFuture:
 *           type: boolean
 *         calculatedPay:
 *           type: number
 */

router.get("/", protect, async (req, res, next) => {
  try {
    const { startDate, endDate, includeFuture = "false" } = req.query;
    let query = { user: req.user.id };
    const dateFilter = {};

    if (startDate) {
      dateFilter.$gte = new Date(startDate);
      dateFilter.$gte.setHours(0, 0, 0, 0);
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate);
      dateFilter.$lte.setHours(23, 59, 59, 999);
    }

    if (includeFuture !== "true" && !dateFilter.$lte) {
      const today = new Date();
      const tomorrow = new Date(
        Date.UTC(
          today.getUTCFullYear(),
          today.getUTCMonth(),
          today.getUTCDate() + 1
        )
      );
      dateFilter.$lt = tomorrow;
    }

    if (Object.keys(dateFilter).length > 0) {
      query.date = dateFilter;
    }

    const sortOrder = { date: "desc" };
    const schedules = await Schedule.find(query).sort(sortOrder);

    const summary = schedules.reduce(
      (acc, s) => {
        let pay = 0;
        if (
          s.scheduleType === "hourly" &&
          typeof s.hours === "number" &&
          typeof s.hourlyRate === "number"
        ) {
          pay = s.hours * s.hourlyRate;
        } else if (
          s.scheduleType === "monthly" &&
          typeof s.monthlySalary === "number"
        ) {
          pay = s.monthlySalary / 4;
        }
        acc.totalHours += typeof s.hours === "number" ? s.hours : 0;
        acc.totalPay += pay;
        return acc;
      },
      { totalHours: 0, totalPay: 0, daysWorked: schedules.length }
    );

    const schedulesWithPay = schedules.map((s) => {
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
      return { ...s.toObject(), calculatedPay: calculatedPay || 0 };
    });

    res.json({
      success: true,
      schedules: schedulesWithPay,
      summary: summary,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/", protect, async (req, res, next) => {
  try {
    const {
      date,
      scheduleType,
      hours,
      hourlyRate,
      monthlySalary,
      tag,
      notes,
      repeatWeekly,
      repeatWeekdays,
    } = req.body;

    if (!date || !scheduleType) {
      return res
        .status(400)
        .json({ success: false, error: "Date and schedule type are required" });
    }
    if (scheduleType === "hourly" && (hours == null || hourlyRate == null)) {
      return res.status(400).json({
        success: false,
        error: "Hours and hourly rate are required for hourly schedule",
      });
    }
    if (scheduleType === "monthly" && monthlySalary == null) {
      return res.status(400).json({
        success: false,
        error: "Monthly salary is required for monthly schedule",
      });
    }

    const scheduleDate = new Date(date);
    scheduleDate.setUTCHours(0, 0, 0, 0);

    const schedulesToCreate = [];
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    if (repeatWeekly && repeatWeekdays && repeatWeekdays.length > 0) {
      const dayOfWeek = scheduleDate.getUTCDay();
      const startOfWeek = new Date(scheduleDate);
      const dayOffset = dayOfWeek === 0 ? -6 : 1;
      startOfWeek.setUTCDate(scheduleDate.getUTCDate() - dayOfWeek + dayOffset);

      for (let i = 0; i < 7; i++) {
        let currentDate = new Date(startOfWeek);
        currentDate.setUTCDate(startOfWeek.getUTCDate() + i);

        const currentDayName = currentDate.toLocaleDateString("en-US", {
          weekday: "long",
          timeZone: "UTC",
        });

        if (
          repeatWeekdays.includes(currentDayName) &&
          currentDate >= scheduleDate
        ) {
          schedulesToCreate.push({
            user: req.user.id,
            date: new Date(currentDate),
            dayOfWeek: currentDayName,
            scheduleType,
            hours: scheduleType === "hourly" ? Number(hours) : undefined,
            hourlyRate:
              scheduleType === "hourly" ? Number(hourlyRate) : undefined,
            monthlySalary:
              scheduleType === "monthly" ? Number(monthlySalary) : undefined,
            tag: tag || notes,
            notes: notes,
            isFuture: currentDate >= today,
          });
        }
      }
    } else {
      const dayOfWeek = scheduleDate.toLocaleDateString("en-US", {
        weekday: "long",
        timeZone: "UTC",
      });
      schedulesToCreate.push({
        user: req.user.id,
        date: scheduleDate,
        dayOfWeek: dayOfWeek,
        scheduleType,
        hours: scheduleType === "hourly" ? Number(hours) : undefined,
        hourlyRate: scheduleType === "hourly" ? Number(hourlyRate) : undefined,
        monthlySalary:
          scheduleType === "monthly" ? Number(monthlySalary) : undefined,
        tag: tag || notes,
        notes: notes,
        isFuture: scheduleDate >= today,
      });
    }

    if (schedulesToCreate.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No valid schedule entries to create for the selected criteria.",
      });
    }

    const createdSchedules = await Schedule.insertMany(schedulesToCreate);

    res.status(201).json({
      success: true,
      count: createdSchedules.length,
      schedules: createdSchedules,
      message: `${createdSchedules.length} schedule(s) added successfully`,
    });
  } catch (error) {
    next(error);
  }
});

router.put("/:id", protect, async (req, res, next) => {
  try {
    const scheduleId = req.params.id;
    const userId = req.user.id;
    const { date, scheduleType, hours, hourlyRate, monthlySalary, tag, notes } =
      req.body;
    if (!mongoose.Types.ObjectId.isValid(scheduleId)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid schedule ID format" });
    }
    const schedule = await Schedule.findOne({ _id: scheduleId, user: userId });
    if (!schedule) {
      return res.status(404).json({
        success: false,
        error: "Schedule not found or permission denied",
      });
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date) {
      const newDate = new Date(date);
      newDate.setUTCHours(0, 0, 0, 0);
      schedule.date = newDate;
      schedule.dayOfWeek = newDate.toLocaleDateString("en-US", {
        weekday: "long",
        timeZone: "UTC",
      });
      schedule.isFuture = newDate >= today;
    }
    if (scheduleType) schedule.scheduleType = scheduleType;
    if (scheduleType === "hourly") {
      if (hours !== undefined) schedule.hours = Number(hours);
      if (hourlyRate !== undefined) schedule.hourlyRate = Number(hourlyRate);
      schedule.monthlySalary = undefined;
    } else if (scheduleType === "monthly") {
      if (monthlySalary !== undefined)
        schedule.monthlySalary = Number(monthlySalary);
      schedule.hours = undefined;
      schedule.hourlyRate = undefined;
    }
    if (tag !== undefined) schedule.tag = tag;
    if (notes !== undefined) schedule.notes = notes;
    const updatedSchedule = await schedule.save();
    let calculatedPay = 0;
    if (
      updatedSchedule.scheduleType === "hourly" &&
      typeof updatedSchedule.hours === "number" &&
      typeof updatedSchedule.hourlyRate === "number"
    ) {
      calculatedPay = updatedSchedule.hours * updatedSchedule.hourlyRate;
    } else if (
      updatedSchedule.scheduleType === "monthly" &&
      typeof updatedSchedule.monthlySalary === "number"
    ) {
      calculatedPay = updatedSchedule.monthlySalary / 4;
    }
    res.json({
      success: true,
      schedule: { ...updatedSchedule.toObject(), calculatedPay: calculatedPay },
      message: "Schedule updated successfully",
    });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", protect, async (req, res, next) => {
  try {
    const scheduleId = req.params.id;
    const userId = req.user.id;
    if (!mongoose.Types.ObjectId.isValid(scheduleId)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid schedule ID format" });
    }
    const schedule = await Schedule.findOne({ _id: scheduleId, user: userId });
    if (!schedule) {
      return res.status(404).json({
        success: false,
        error: "Schedule not found or permission denied",
      });
    }
    await schedule.deleteOne();
    res.json({ success: true, message: "Schedule deleted successfully" });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/upload",
  protect,
  uploadSchedule.single("file"),
  async (req, res, next) => {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, error: "No file uploaded." });
    }
    try {
      const workbook = xlsx.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = xlsx.utils.sheet_to_json(sheet, {
        header: 1,
        raw: false,
        dateNF: "yyyy-mm-dd",
      });
      if (!jsonData || jsonData.length < 2) {
        return res.status(400).json({
          success: false,
          error: "File is empty or missing header row.",
        });
      }
      const headers = jsonData[0].map((h) => String(h).trim().toLowerCase());
      const requiredHeaders = ["date", "hours", "hourly_rate"];
      const missingHeaders = requiredHeaders.filter(
        (rh) => !headers.includes(rh)
      );
      if (missingHeaders.length > 0) {
        return res.status(400).json({
          success: false,
          error: `Missing required columns: ${missingHeaders.join(", ")}`,
        });
      }
      const dateIndex = headers.indexOf("date");
      const hoursIndex = headers.indexOf("hours");
      const rateIndex = headers.indexOf("hourly_rate");
      const tagIndex = headers.indexOf("tag");
      const notesIndex = headers.indexOf("notes");
      const previewData = [];
      const validDataToStore = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      for (let i = 2; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (
          !row ||
          row.every(
            (cell) =>
              cell === null || cell === undefined || String(cell).trim() === ""
          )
        ) {
          continue;
        }
        const rowData = {};
        let isValid = true;
        const errors = [];
        const dateStr = row[dateIndex] ? String(row[dateIndex]).trim() : null;
        let scheduleDate;
        if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          scheduleDate = new Date(dateStr + "T00:00:00Z");
          if (isNaN(scheduleDate.getTime())) {
            isValid = false;
            errors.push("Invalid date value.");
            scheduleDate = null;
          } else {
            rowData.date = scheduleDate;
            rowData.dayOfWeek = scheduleDate.toLocaleDateString("en-US", {
              weekday: "long",
              timeZone: "UTC",
            });
          }
        } else {
          isValid = false;
          errors.push("Missing/invalid date (YYYY-MM-DD).");
        }
        const hoursStr = row[hoursIndex]
          ? String(row[hoursIndex]).trim()
          : null;
        const hours = parseFloat(hoursStr);
        if (hoursStr === null || isNaN(hours) || hours <= 0 || hours > 24) {
          isValid = false;
          errors.push("Invalid hours (> 0, <= 24).");
        } else {
          rowData.hours = hours;
        }
        const rateStr = row[rateIndex] ? String(row[rateIndex]).trim() : null;
        const rate = parseFloat(rateStr);
        if (rateStr === null || isNaN(rate) || rate < 0) {
          isValid = false;
          errors.push("Invalid rate (>= 0).");
        } else {
          rowData.hourlyRate = rate;
        }
        rowData.tag = row[tagIndex] ? String(row[tagIndex]).trim() : null;
        rowData.notes = row[notesIndex] ? String(row[notesIndex]).trim() : null;
        rowData.scheduleType = "hourly";
        if (scheduleDate) {
          rowData.isFuture = scheduleDate >= today;
        }
        const previewRow = {
          row: i + 1,
          date: dateStr || "Invalid",
          hours:
            hoursStr === null ? "Missing" : isNaN(hours) ? "Invalid" : hours,
          hourlyRate:
            rateStr === null
              ? "Missing"
              : isNaN(rate)
              ? "Invalid"
              : rate.toFixed(2),
          tag: rowData.tag,
          notes: rowData.notes,
          isValid: isValid,
          errors: errors,
          day: isValid && scheduleDate ? rowData.dayOfWeek : "N/A",
        };
        previewData.push(previewRow);
        if (isValid) {
          validDataToStore.push({
            originalRowIndex: i,
            user: req.user.id,
            date: rowData.date,
            dayOfWeek: rowData.dayOfWeek,
            scheduleType: rowData.scheduleType,
            hours: rowData.hours,
            hourlyRate: rowData.hourlyRate,
            tag: rowData.tag,
            notes: rowData.notes,
            isFuture: rowData.isFuture,
          });
        }
      }
      if (previewData.length === 0) {
        return res
          .status(400)
          .json({ success: false, error: "No data rows found in the file." });
      }
      const tempFileId = crypto.randomBytes(16).toString("hex");
      uploadCache.set(tempFileId, validDataToStore);
      setTimeout(() => {
        uploadCache.delete(tempFileId);
      }, 60 * 60 * 1000);
      res.json({
        success: true,
        preview: previewData.slice(0, 10),
        totalRows: previewData.length,
        valid: validDataToStore.length,
        invalid: previewData.length - validDataToStore.length,
        tempFileId: tempFileId,
      });
    } catch (error) {
      if (error instanceof multer.MulterError) {
        return res.status(400).json({ success: false, error: error.message });
      } else if (error.message && error.message.includes("Sheet")) {
        return res.status(400).json({
          success: false,
          error: "Could not parse the uploaded file.",
        });
      }
      console.error("Upload error:", error);
      next(error);
    } finally {
      if (req.file && req.file.path) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error("Error deleting temp upload file:", err);
        });
      }
    }
  }
);

router.post("/confirm-upload", protect, async (req, res, next) => {
  const { tempFileId, rowsToImport } = req.body;
  if (!tempFileId || !Array.isArray(rowsToImport)) {
    return res.status(400).json({
      success: false,
      error: "Missing tempFileId or rowsToImport array.",
    });
  }
  const storedData = uploadCache.get(tempFileId);
  if (!storedData) {
    return res
      .status(404)
      .json({ success: false, error: "Upload session expired or invalid ID." });
  }
  const dataToInsert = storedData.filter((item) =>
    rowsToImport.includes(item.originalRowIndex + 1)
  );
  if (dataToInsert.length === 0) {
    uploadCache.delete(tempFileId);
    return res
      .status(400)
      .json({ success: false, error: "No valid rows selected for import." });
  }
  try {
    const cleanDataToInsert = dataToInsert.map(
      ({ originalRowIndex, ...rest }) => rest
    );
    const createdSchedules = await Schedule.insertMany(cleanDataToInsert);
    uploadCache.delete(tempFileId);
    res.json({
      success: true,
      imported: createdSchedules.length,
      message: `${createdSchedules.length} schedules imported successfully.`,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/template", protect, (req, res, next) => {
  try {
    const headers = ["date", "hours", "hourly_rate", "tag", "notes"];
    const exampleData = [
      [
        "YYYY-MM-DD",
        "Number (e.g., 8 or 6.5)",
        "Number (e.g., 15.50)",
        "Optional Text",
        "Optional Text",
      ],
      ["2025-10-27", "8", "16.00", "Project A", "Regular shift"],
      ["2025-10-28", "6.5", "16.50", "Project B", "Includes OT calculation"],
    ];
    const worksheet = xlsx.utils.aoa_to_sheet([headers, ...exampleData]);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "ScheduleData");
    worksheet["!cols"] = [
      { wch: 12 },
      { wch: 10 },
      { wch: 12 },
      { wch: 15 },
      { wch: 30 },
    ];
    const buffer = xlsx.write(workbook, { bookType: "xlsx", type: "buffer" });
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=schedule_template.xlsx"
    );
    res.send(buffer);
  } catch (error) {
    console.error("Error generating template:", error);
    next(new Error("Failed to generate template file."));
  }
});

module.exports = router;
