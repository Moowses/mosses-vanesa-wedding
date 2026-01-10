import crypto from "crypto";

type Payload = {
  guestId: string;
  exp?: number; // optional expiry timestamp (ms)
};

function base64url(input: Buffer | string) {
  return Buffer.from(input).toString("base64url");
}

function base64urlDecode(input: string) {
  return Buffer.from(input, "base64url").toString("utf8");
}

export function signToken(payload: Payload): string {
  const secret = process.env.RSVP_TOKEN_SECRET;
  if (!secret) {
    throw new Error("RSVP_TOKEN_SECRET is not set");
  }

  const body = base64url(JSON.stringify(payload));
  const signature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("base64url");

  return `${body}.${signature}`;
}

export function verifyToken(token: string): Payload | null {
  const secret = process.env.RSVP_TOKEN_SECRET;
  if (!secret) {
    throw new Error("RSVP_TOKEN_SECRET is not set");
  }

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [body, signature] = parts;

  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("base64url");

  // timing-safe comparison
  if (
    !crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSig)
    )
  ) {
    return null;
  }

  const payload = JSON.parse(base64urlDecode(body)) as Payload;

  // optional expiration check
  if (payload.exp && Date.now() > payload.exp) {
    return null;
  }

  return payload;
}
