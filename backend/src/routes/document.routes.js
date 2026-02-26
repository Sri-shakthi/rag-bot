const express = require("express");
const multer = require("multer");
const { uploadDocument, getDocuments } = require("../controllers/document.controller");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.post("/upload", upload.single("file"), async (req, res, next) => {
  try {
    const result = await uploadDocument(req);
    console.log("Final route response for /api/documents/upload:", result);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const result = await getDocuments(req);
    console.log("Final route response for /api/documents:", result);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
