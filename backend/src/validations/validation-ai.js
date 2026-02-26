const Joi = require("joi");

const aiSchema = Joi.object({
  sessionId: Joi.string().trim().min(3).max(128).required().messages({
    "string.base": "Invalid sessionId",
    "string.empty": "Invalid sessionId",
    "any.required": "Invalid sessionId"
  }),
  message: Joi.string().trim().min(1).max(4000).required().messages({
    "string.base": "Invalid message",
    "string.empty": "Invalid message",
    "any.required": "Invalid message"
  }),
  history: Joi.array()
    .items(
      Joi.object({
        role: Joi.string().valid("user", "assistant").required(),
        content: Joi.string().trim().min(1).max(12000).required()
      })
    )
    .max(20)
    .default([])
});

function validateAiRequest(req, res, next) {
  const { error, value } = aiSchema.validate(req.body, { abortEarly: true });
  if (error) {
    return res.status(400).json({
      error: true,
      message: error.details[0].message
    });
  }
  req.validatedBody = value;
  return next();
}

module.exports = {
  validateAiRequest
};
