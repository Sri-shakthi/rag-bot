const express = require("express");
const { validateChatRequest } = require("../validations/validation-chat");
const {
  postChat,
  createChatSession,
  getChatSessions,
  getChatSession
} = require("../controllers/chat.controller");

const router = express.Router();

router.post("/chat/sessions", async (req, res, next) => {
  try {
    const result = await createChatSession(req);
    console.log("Final route response for /api/chat/sessions:", result);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
});

router.get("/chat/sessions", async (req, res, next) => {
  try {
    const result = await getChatSessions(req);
    console.log("Final route response for GET /api/chat/sessions:", result);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
});

router.get("/chat/sessions/:sessionId", async (req, res, next) => {
  try {
    const result = await getChatSession(req);
    console.log("Final route response for GET /api/chat/sessions/:sessionId:", result);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
});

router.post("/chat", validateChatRequest, async (req, res, next) => {
  try {
    const result = await postChat(req);
    console.log("Final route response for /api/chat:", result);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;