import crypto from "node:crypto";

const TOKEN_DELIMITER = ".";

export type RsvpTokenPayload = {
  email: string;
  exp: number;
  iat: number;
  v: 1;
};

function getSecret(): string {
  const secret = process.env.RSVP_TOKEN_SECRET;
  if (!secret) {
    throw new Error("Missing RSVP_TOKEN_SECRET environment variable");
  }
  return secret;
}

function keyFromSecret(secret: string): Buffer {
  return crypto.createHash("sha256").update(secret).digest();
}

function base64UrlDecode(value: string): Buffer {
  return Buffer.from(value, "base64url");
}

function parsePayload(payload: string): RsvpTokenPayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(payload);
  } catch {
    throw new Error("Malformed RSVP token payload");
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    !("email" in parsed) ||
    !("exp" in parsed) ||
    !("iat" in parsed) ||
    !("v" in parsed)
  ) {
    throw new Error("Malformed RSVP token payload");
  }

  const candidate = parsed as {
    email: unknown;
    exp: unknown;
    iat: unknown;
    v: unknown;
  };

  if (
    typeof candidate.email !== "string" ||
    typeof candidate.exp !== "number" ||
    typeof candidate.iat !== "number" ||
    candidate.v !== 1
  ) {
    throw new Error("Malformed RSVP token payload");
  }

  return {
    email: candidate.email,
    exp: candidate.exp,
    iat: candidate.iat,
    v: 1,
  };
}

function buildPayload(email: string, expiresAtMs: number): RsvpTokenPayload {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    throw new Error("Email cannot be empty");
  }

  return {
    email: normalizedEmail,
    exp: expiresAtMs,
    iat: Date.now(),
    v: 1,
  };
}

export function createRsvpToken(
  email: string,
  options?: { expiresAt?: Date | number }
): string {
  const secret = getSecret();
  const key = keyFromSecret(secret);
  const expiresAtMs =
    options?.expiresAt instanceof Date
      ? options.expiresAt.getTime()
      : options?.expiresAt ?? Date.now() + 1000 * 60 * 60 * 24 * 120;

  const payload = buildPayload(email, expiresAtMs);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    iv.toString("base64url"),
    encrypted.toString("base64url"),
    tag.toString("base64url"),
  ].join(TOKEN_DELIMITER);
}

export function resolveRsvpToken(token: string): string {
  const [ivPart, encryptedPart, tagPart, ...rest] = token.split(TOKEN_DELIMITER);
  if (!ivPart || !encryptedPart || !tagPart || rest.length > 0) {
    throw new Error("Invalid RSVP token format");
  }

  const secret = getSecret();
  const key = keyFromSecret(secret);

  const iv = base64UrlDecode(ivPart);
  const encrypted = base64UrlDecode(encryptedPart);
  const tag = base64UrlDecode(tagPart);

  try {
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);
    const payload = parsePayload(decrypted.toString("utf8"));

    if (Date.now() > payload.exp) {
      throw new Error("RSVP token expired");
    }

    return payload.email;
  } catch (err) {
    if (err instanceof Error && err.message === "RSVP token expired") {
      throw err;
    }
    throw new Error("Invalid RSVP token");
  }
}
