#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";

function parseArgs(argv) {
  const args = {
    baseUrl: "https://amorfati.io/rsvp",
    input: "",
    emails: "",
    expiresAt: "",
    output: "",
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    const value = argv[i + 1];

    if (arg === "--base-url" && value) {
      args.baseUrl = value;
      i += 1;
    } else if (arg === "--input" && value) {
      args.input = value;
      i += 1;
    } else if (arg === "--emails" && value) {
      args.emails = value;
      i += 1;
    } else if (arg === "--expires-at" && value) {
      args.expiresAt = value;
      i += 1;
    } else if (arg === "--output" && value) {
      args.output = value;
      i += 1;
    } else if (arg === "--help") {
      printHelp();
      process.exit(0);
    }
  }

  return args;
}

function printHelp() {
  const lines = [
    "Generate personal RSVP links with encrypted identity tokens.",
    "",
    "Usage:",
    "  node scripts/generate-rsvp-links.mjs --input attendees.txt",
    "  node scripts/generate-rsvp-links.mjs --emails alice@x.com,bob@y.com",
    "",
    "Options:",
    "  --input <path>      File with one email per line",
    "  --emails <list>     Comma-separated emails",
    "  --base-url <url>    RSVP page URL (default: https://amorfati.io/rsvp)",
    "  --expires-at <iso>  Token expiration datetime (ISO-8601)",
    "  --output <path>     Write CSV to file instead of stdout",
    "",
    "Required env:",
    "  RSVP_TOKEN_SECRET",
  ];
  console.log(lines.join("\n"));
}

function readEmails({ input, emails }) {
  const set = new Set();

  if (input) {
    const content = fs.readFileSync(input, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const email = line.trim().toLowerCase();
      if (email) set.add(email);
    }
  }

  if (emails) {
    for (const item of emails.split(",")) {
      const email = item.trim().toLowerCase();
      if (email) set.add(email);
    }
  }

  return [...set];
}

function keyFromSecret(secret) {
  return crypto.createHash("sha256").update(secret).digest();
}

function createToken(email, key, expiresAtMs) {
  const payload = JSON.stringify({
    email,
    exp: expiresAtMs,
    iat: Date.now(),
    v: 1,
  });
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(payload, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    iv.toString("base64url"),
    encrypted.toString("base64url"),
    tag.toString("base64url"),
  ].join(".");
}

function csvEscape(value) {
  if (value.includes(",") || value.includes('"')) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

function main() {
  const args = parseArgs(process.argv);
  const secret = process.env.RSVP_TOKEN_SECRET;

  if (!secret) {
    console.error("Missing RSVP_TOKEN_SECRET environment variable");
    process.exit(1);
  }

  const emails = readEmails(args);
  if (emails.length === 0) {
    console.error("No emails provided. Use --input or --emails.");
    process.exit(1);
  }

  const expiresAtMs = args.expiresAt
    ? new Date(args.expiresAt).getTime()
    : Date.now() + 1000 * 60 * 60 * 24 * 120;

  if (!Number.isFinite(expiresAtMs)) {
    console.error("Invalid --expires-at value. Use an ISO datetime.");
    process.exit(1);
  }

  const base = args.baseUrl.replace(/\/$/, "");
  const key = keyFromSecret(secret);

  const lines = ["email,link"];
  for (const email of emails) {
    const token = createToken(email, key, expiresAtMs);
    const link = `${base}?t=${encodeURIComponent(token)}`;
    lines.push(`${csvEscape(email)},${csvEscape(link)}`);
  }

  const output = `${lines.join("\n")}\n`;

  if (args.output) {
    fs.writeFileSync(args.output, output, "utf8");
    console.log(`Wrote ${emails.length} links to ${args.output}`);
    return;
  }

  process.stdout.write(output);
}

main();
