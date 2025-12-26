const Joi = require("joi");

const assessmentValidationSchema = Joi.object({
  patientName: Joi.string().min(3).max(100).required(),
  age: Joi.number().integer().min(1).max(120).required(),
  gender: Joi.string().valid("Male", "Female", "Other").required(),
  height: Joi.number().min(50).max(250).required(),
  weight: Joi.number().min(10).max(300).required(),
  conditions: Joi.string().max(300).allow(""),
  medications: Joi.string().max(300).allow(""),
  allergies: Joi.string().max(300).allow(""),
  prakriti: Joi.string().valid("Vata", "Pitta", "Kapha").required(),
  dietType: Joi.string()
    .valid("Vegetarian", "Non-Vegetarian", "Vegan")
    .required(),
  activityLevel: Joi.number().integer().min(1).max(5).required(),
  preferences: Joi.alternatives().try(
    Joi.array().items(Joi.string().trim()),
    Joi.string().allow("")
  ),
});

module.exports = assessmentValidationSchema;
