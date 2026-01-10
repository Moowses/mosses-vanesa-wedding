import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { signToken, verifyToken } from "../lib/guestToken";

const token = signToken({ guestId: "test-guest-123" });
console.log("TOKEN:", token);

const decoded = verifyToken(token);
console.log("DECODED:", decoded);
