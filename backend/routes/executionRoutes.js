const express = require("express");
const { executeCode } = require("../controllers/executionController");

const router = express.Router();

router.post("/", executeCode);

module.exports = router;
