const express = require("express");
const { validateCaseIdParam } = require("../validations/validation-case");
const { getCases, getCaseById } = require("../controllers/case.controller");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const result = await getCases();
    console.log("Final route response for /api/cases:", result);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
});

router.get("/:caseId", validateCaseIdParam, async (req, res, next) => {
  try {
    const result = await getCaseById(req.validatedParams.caseId);
    console.log("Final route response for /api/cases/:caseId:", result);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
