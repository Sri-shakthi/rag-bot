const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const config = require("../config");
const { AppError } = require("../utils/errorHandler");

const googleClient = new OAuth2Client();

function assertAuthConfig() {
  if (!config.googleClientIds.length) {
    throw new AppError("Missing GOOGLE_CLIENT_ID/GOOGLE_CLIENT_IDS on backend", 500);
  }
  if (!config.authJwtSecret) {
    throw new AppError("Missing AUTH_JWT_SECRET on backend", 500);
  }
}

async function verifyGoogleIdToken(idToken) {
  assertAuthConfig();
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: config.googleClientIds
  });
  const payload = ticket.getPayload();
  if (!payload?.sub || !payload?.email) {
    throw new AppError("Invalid Google token payload", 401);
  }

  return {
    sub: payload.sub,
    email: payload.email,
    name: payload.name || payload.email,
    picture: payload.picture || ""
  };
}

function signAuthToken(user) {
  assertAuthConfig();
  return jwt.sign(user, config.authJwtSecret, {
    expiresIn: Math.floor(config.authCookieMaxAgeMs / 1000)
  });
}

function verifyAuthToken(token) {
  if (!config.authJwtSecret) {
    throw new AppError("Missing AUTH_JWT_SECRET on backend", 500);
  }
  return jwt.verify(token, config.authJwtSecret);
}

module.exports = {
  verifyGoogleIdToken,
  signAuthToken,
  verifyAuthToken
};
