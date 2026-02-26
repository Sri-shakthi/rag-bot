const Joi = require("joi");

const caseIdSchema = Joi.object({
  caseId: Joi.string().trim().required().messages({
    "string.base": "Invalid caseId",
    "string.empty": "Invalid caseId",
    "any.required": "Invalid caseId"
  })
});

function validateCaseIdParam(req, res, next) {
  const { error, value } = caseIdSchema.validate(req.params, { abortEarly: true });
  if (error) {
    return res.status(400).json({
      error: true,
      message: error.details[0].message
    });
  }
  req.validatedParams = value;
  return next();
}

module.exports = {
  validateCaseIdParam
};
