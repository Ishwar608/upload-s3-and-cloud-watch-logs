const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const pdfParse = require("pdf-parse");
const mongoose = require("mongoose");
const logger = require("../utils/logger");
const Resume = require("../db/Resume.model"); // we'll create this schema
require("dotenv").config();

const router = express.Router();
const s3 = new S3Client({ region: process.env.AWS_REGION });

const upload = multer({ dest: "uploads/" });

router.post("/upload-resume", upload.single("resume"), async (req, res) => {
  try {
    const file = req.file;
    const fileStream = fs.createReadStream(file.path);
    const s3Key = `resumes/${file.filename}.pdf`;

    // Upload to S3
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: s3Key,
        Body: fileStream,
        ContentType: "application/pdf",
      })
    );

    logger.info(`Resume uploaded to S3: ${s3Key}`);
    fs.unlinkSync(file.path);

    res
      .status(200)
      .json({ message: "Resume uploaded successfully", key: s3Key });
  } catch (err) {
    logger.error("Resume upload failed", { error: err.message });
    res.status(500).json({ error: "Failed to upload resume" });
  }
});

router.get("/process-resume", async (req, res) => {
  const { key } = req.query;
  if (!key) return res.status(400).json({ error: "Missing S3 key" });

  try {
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
    });

    const response = await s3.send(command);
    const buffer = await response.Body.transformToByteArray();
    const data = await pdfParse(buffer);

    const text = data.text;

    // Very basic field extraction
    const email =
      text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/)?.[0] || "";
    const phone = text.match(/(?:\+\d{1,3}[- ]?)?\d{10}/)?.[0] || "";
    const name = text.split("\n")[0].trim(); // first line as name (assumption)

    const resumeData = new Resume({ name, email, phone, s3Key: key });
    await resumeData.save();

    logger.info("Extracted and saved resume data", { name, email });

    res.status(200).json({ message: "Resume processed", name, email, phone });
  } catch (err) {
    logger.error("Failed to process resume", { error: err.message });
    res.status(500).json({ error: "Failed to process resume" });
  }
});

module.exports = router;
