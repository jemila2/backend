

const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // For auth (if needed)
  role: { type: String, enum: ["washer", "ironer", "delivery", "manager"], required: true },
  contact: { type: String, required: true },
  salary: { type: Number, required: true },
  shifts: [{ type: String }], // e.g., ["Mon 9AM-5PM", "Tue 1PM-9PM"]
  performance: [
    {
      date: { type: Date, default: Date.now },
      rating: { type: Number, min: 1, max: 5 },
      feedback: String,
    },
  ],
}, { timestamps: true });

module.exports = mongoose.model("Employee", employeeSchema);