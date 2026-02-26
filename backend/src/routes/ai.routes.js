const express = require("express");
const { validateAiRequest } = require("../validations/validation-ai");
const { postAiMessage } = require("../controllers/ai.controller");

const router = express.Router();

router.post("/message", validateAiRequest, async (req, res, next) => {
  try {
    const result = await postAiMessage(req);
    console.log("Final route response for /api/ai/message:", result);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
