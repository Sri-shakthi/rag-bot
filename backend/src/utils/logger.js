function info(message, meta = {}) {
  console.log(
    JSON.stringify({
      level: "info",
      timestamp: new Date().toISOString(),
      message,
      ...meta
    })
  );
}

function error(message, meta = {}) {
  console.error(
    JSON.stringify({
      level: "error",
      timestamp: new Date().toISOString(),
      message,
      ...meta
    })
  );
}

module.exports = {
  info,
  error
};
