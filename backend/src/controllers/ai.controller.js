const { runAiMessage } = require("../services/ai.service");

async function postAiMessage(req) {
  return runAiMessage(req.validatedBody);
}

module.exports = {
  postAiMessage
};
