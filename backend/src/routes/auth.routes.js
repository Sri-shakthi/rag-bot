const express = require("express");

const router = express.Router();

function buildUser() {
  return {
    sub: "local-dev-user",
    email: process.env.DEV_USER_EMAIL || "dev.user@example.com",
    name: process.env.DEV_USER_NAME || "Dev User",
    picture: process.env.DEV_USER_PICTURE || ""
  };
}

router.get("/me", async (req, res, next) => {
  try {
    const result = { user: buildUser() };
    console.log("Final route response for /api/auth/me:", result);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
});

router.post("/google", async (req, res, next) => {
  try {
    const result = { user: buildUser() };
    console.log("Final route response for /api/auth/google:", result);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
});

router.post("/logout", async (req, res, next) => {
  try {
    const result = { success: true, message: "Logged out successfully" };
    console.log("Final route response for /api/auth/logout:", result);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
