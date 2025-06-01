const express = require("express");
const logger = require("../utils/logger"); // path depends on where you place it
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const ExcelJS = require("exceljs");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config();
const User = require("../db/User.model"); // update path as needed
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const router = express.Router();
const s3 = new S3Client({ region: process.env.AWS_REGION });

router.get("/export", async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    logger.warn("Missing userId in request.");
    return res.status(400).json({ error: "userId is required" });
  }

  try {
    logger.info(`Received export request for userId: ${userId}`);

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI);
    }

    const user = await User.findById(userId);
    if (!user) {
      logger.warn(`User not found: ${userId}`);
      return res.status(404).json({ error: "User not found" });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("User Data");

    worksheet.columns = [
      { header: "Title", key: "title", width: 10 },
      { header: "First Name", key: "firstName", width: 15 },
      { header: "Last Name", key: "lastName", width: 15 },
      { header: "Email", key: "email", width: 25 },
      { header: "Accept Terms", key: "acceptTerms", width: 15 },
      { header: "Created", key: "created", width: 20 },
      { header: "Role", key: "role", width: 10 },
    ];

    worksheet.addRow({
      title: user.title,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      acceptTerms: user.acceptTerms ? "Yes" : "No",
      created: user.created?.toISOString(),
      role: user.role,
    });

    const fileName = `user-${userId}.xlsx`;
    const filePath = path.join(__dirname, `../temp/${fileName}`);
    await workbook.xlsx.writeFile(filePath);
    logger.info(`Excel file created: ${fileName}`);

    const fileStream = fs.createReadStream(filePath);
    const uploadParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: `exports/${fileName}`,
      Body: fileStream,
      ContentType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };

    await s3.send(new PutObjectCommand(uploadParams));
    logger.info(`Uploaded to S3: exports/${fileName}`);

    fs.unlinkSync(filePath);
    logger.info(`Deleted temp file: ${fileName}`);

    res.status(200).json({
      message: "User data exported and uploaded successfully.",
      s3Key: `exports/${fileName}`,
    });
  } catch (error) {
    logger.error("Export failed", { error: error.message });
    res.status(500).json({ error: "Internal server error" });
  }
});

// Generate pre-signed URL (upload or download)
router.get("/presigned-url", async (req, res) => {
  const { type, key } = req.query;

  if (!type || !["put", "get"].includes(type) || !key) {
    logger.warn("Invalid request for pre-signed URL", { query: req.query });
    return res
      .status(400)
      .json({ error: "Missing or invalid 'type' or 'key'" });
  }

  try {
    const command =
      type === "put"
        ? new PutObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: key,
            ContentType: "application/octet-stream",
          })
        : new GetObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: key,
          });

    const url = await getSignedUrl(s3, command, { expiresIn: 180 }); // 3 minutes

    logger.info(`Generated ${type.toUpperCase()} pre-signed URL`, { key, url });
    res.json({ url });
  } catch (error) {
    logger.error("Failed to generate pre-signed URL", { error: error.message });
    res.status(500).json({ error: "Could not generate pre-signed URL" });
  }
});

module.exports = router;
