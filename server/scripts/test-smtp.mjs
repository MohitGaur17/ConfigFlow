#!/usr/bin/env node
import dotenv from "dotenv";
import nodemailer from "nodemailer";

// Load server .env by default
dotenv.config({ path: new URL("../.env", import.meta.url).pathname });

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || process.env.EMAIL_FROM;
const SMTP_SECURE = process.env.SMTP_SECURE === "true" || SMTP_PORT === 465;

const TO = process.env.TEST_TO || SMTP_FROM;

async function run() {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
    console.error("Missing SMTP configuration in .env (SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM)");
    process.exit(2);
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  try {
    console.log("Verifying SMTP connection...");
    await transporter.verify();
    console.log("SMTP connection ok. Sending test message to:", TO);

    const res = await transporter.sendMail({
      from: SMTP_FROM,
      to: TO,
      subject: "ConfigFlow SMTP test",
      text: `This is a test message from ConfigFlow. If you received this, SMTP is working. Time: ${new Date().toISOString()}`,
    });

    console.log("Message sent. result:", res);
    process.exit(0);
  } catch (err) {
    console.error("SMTP test failed:", err);
    process.exit(1);
  }
}

run();
