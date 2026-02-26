const express = require("express");
const config = require("../config");
const { AppError } = require("../utils/errorHandler");
const { requireAuth } = require("../middlewares/auth.middleware");
const { verifyGoogleIdToken, signAuthToken } = require("../services/auth.service");

const router = express.Router();

function getAuthCookieOptions() {
  return {
    httpOnly: true,
    secure: config.authCookieSecure,
    sameSite: config.authCookieSameSite,
    maxAge: config.authCookieMaxAgeMs,
    path: "/"
  };
}

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const result = { user: req.user };
    console.log("Final route response for /api/auth/me:", result);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
});

router.post("/google", async (req, res, next) => {
  try {
    const idToken = String(req.body?.idToken || "").trim();
    if (!idToken) {
      throw new AppError("idToken is required", 400);
    }

    const user = await verifyGoogleIdToken(idToken);
    const authToken = signAuthToken(user);
    res.cookie(config.authCookieName, authToken, getAuthCookieOptions());

    const result = { user };
    console.log("Final route response for /api/auth/google:", result);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
});

router.post("/logout", async (req, res, next) => {
  try {
    res.clearCookie(config.authCookieName, {
      httpOnly: true,
      secure: config.authCookieSecure,
      sameSite: config.authCookieSameSite,
      path: "/"
    });
    const result = { success: true, message: "Logged out successfully" };
    console.log("Final route response for /api/auth/logout:", result);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
