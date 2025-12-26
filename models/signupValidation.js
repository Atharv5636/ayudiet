const Joi=require("joi");
const signupValidation = Joi.object({
  fullname: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  phone: Joi.string()
    .pattern(/^\+?[0-9]{10,13}$/)
    .required()
    .messages({
      "string.pattern.base": "Phone must be a valid 10-13 digit number, optional + prefix"
    }),
  specialization: Joi.string()
    .valid("Ayurveda", "Clinical Nutrition", "General Medicine", "Internal Medicine", "Other")
    .required(),
  clinic: Joi.string().min(2).max(100).required(),
  password: Joi.string().min(6).required(),
  confirm_password: Joi.ref("password"),

  // ✅ Add missing fields
  terms: Joi.boolean().valid(true).required().messages({
    "any.only": "You must accept the terms"
  }),
  licensed: Joi.boolean().required()
});
module.exports = signupValidation;
