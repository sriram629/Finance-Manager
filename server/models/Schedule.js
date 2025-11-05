const mongoose = require("mongoose");

const ScheduleSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    dayOfWeek: { type: String, required: true },
    hours: { type: Number, required: true },
    hourlyRate: { type: Number },
    scheduleType: {
      type: String,
      enum: ["hourly", "full-time"],
      required: true,
    },
    monthlySalary: { type: Number },
    tag: { type: String },
    notes: { type: String },
    isFuture: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

ScheduleSchema.index({ user: 1, date: 1 });

module.exports = mongoose.model("Schedule", ScheduleSchema);
