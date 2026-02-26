const Joi = require("joi");

const chatSchema = Joi.object({
  sessionId: Joi.string().trim().min(3).max(128).required().messages({
    "string.base": "Invalid sessionId",
    "string.empty": "Invalid sessionId",
    "any.required": "Invalid sessionId"
  }),
  caseId: Joi.string().trim().allow("", null).messages({
    "string.base": "Invalid caseId",
    "string.empty": "Invalid caseId"
  }),
  documentId: Joi.string().trim().allow("", null).messages({
    "string.base": "Invalid documentId",
    "string.empty": "Invalid documentId"
  }),
  message: Joi.string().trim().min(1).max(4000).required().messages({
    "string.base": "Invalid message",
    "string.empty": "Invalid message",
    "any.required": "Invalid message"
  })
}).custom((value, helpers) => {
  const hasCase = Boolean(value.caseId);
  const hasDocument = Boolean(value.documentId);
  if (!hasCase && !hasDocument) {
    return helpers.error("any.custom", {
      message: "Either caseId or documentId is required"
    });
  }
  return value;
}).messages({
  "any.custom": "{{#message}}"
});

function validateChatRequest(req, res, next) {
  const { error, value } = chatSchema.validate(req.body, { abortEarly: true });
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
  validateChatRequest
};
