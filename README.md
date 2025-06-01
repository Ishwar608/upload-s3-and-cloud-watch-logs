# 🧾 Node.js AWS S3 + CloudWatch Logging + MongoDB Project

This project is a full-featured Node.js backend application built with Express.js that performs the following tasks:

- ✅ Read user data from MongoDB and export it to Excel
- ✅ Upload the Excel file to Amazon S3
- ✅ Upload resume PDFs to S3 and extract key details (name, email, phone) from them
- ✅ Save extracted data to MongoDB
- ✅ Generate pre-signed S3 URLs for secure upload/download
- ✅ Log all API activity to Amazon CloudWatch using Winston

---

## 📦 Tech Stack

- **Node.js / Express**
- **MongoDB / Mongoose**
- **Amazon S3 (AWS SDK v3)**
- **Winston + winston-cloudwatch**
- **Multer** (for file uploads)
- **ExcelJS** (for Excel file creation)
- **pdf-parse** (for parsing PDF resumes)
- **dotenv** (for environment config)

---

## 🚀 Features

### 📊 User Data Export

- Fetch user data from MongoDB
- Create an Excel file with `exceljs`
- Upload it to S3
- Log the process to CloudWatch

### 📄 Resume Upload & Processing

- Upload `.pdf` files using `multer`
- Upload to S3 with metadata
- Extract fields using `pdf-parse`
- Save to MongoDB

### 🔐 Pre-signed URL

- Generate short-lived signed URLs (PUT / GET)
- Expire in 3 minutes
- Safe for client-side uploads/downloads

### 📝 Logging

- All API requests/responses are logged to CloudWatch
- Sensitive data (like passwords) is masked

---

## 📁 Project Structure
