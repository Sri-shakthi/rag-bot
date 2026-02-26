const config = require("../config");
const { verifyAuthToken } = require("../services/auth.service");

function parseCookies(cookieHeader) {
  if (!cookieHeader) return {};
  return cookieHeader.split(";").reduce((acc, item) => {
    const [rawKey, ...rawValue] = item.trim().split("=");
    if (!rawKey) return acc;
    acc[rawKey] = decodeURIComponent(rawValue.join("=") || "");
    return acc;
  }, {});
}

function getTokenFromRequest(req) {
  const cookies = req.cookies || parseCookies(req.headers.cookie || "");
  const cookieToken = cookies[config.authCookieName];
  if (cookieToken) return cookieToken;

  const authHeader = req.headers.authorization || "";
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length).trim();
  }

  return "";
}

function requireAuth(req, res, next) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({
        error: true,
        message: "Unauthorized"
      });
    }

    const user = verifyAuthToken(token);
    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({
      error: true,
      message: "Unauthorized"
    });
  }
}

module.exports = {
  requireAuth
};
