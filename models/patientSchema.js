const mongoose = require("mongoose");

const assessmentSchema = new mongoose.Schema(
  {
    patientName: { type: String, required: true, minlength: 3, maxlength: 100, trim: true },
    age: { type: Number, required: true, min: 1, max: 120 },
    gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
    height: { type: Number, required: true, min: 50, max: 250 },
    weight: { type: Number, required: true, min: 10, max: 300 },
    conditions: { type: String, maxlength: 300, default: "" },
    medications: { type: String, maxlength: 300, default: "" },
    allergies: { type: String, maxlength: 300, default: "" },
    prakriti: { type: String, enum: ["Vata", "Pitta", "Kapha"], required: true },
    dietType: { type: String, enum: ["Vegetarian", "Non-Vegetarian", "Vegan"], required: true },
    activityLevel: { type: Number, required: true, min: 1, max: 5 },
    preferences: { type: [String], default: [] },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true } // new field
  },
  { timestamps: true }
);


module.exports = mongoose.model("Assessment", assessmentSchema);
