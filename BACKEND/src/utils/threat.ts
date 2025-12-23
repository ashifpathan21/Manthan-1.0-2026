import axios from "axios";
import { config } from "dotenv";

config();

const SAFE_BROWSING_KEY = process.env.GOOGLE_API_KEY;
const API_URL =
  "https://safebrowsing.googleapis.com/v4/threatMatches:find";

if (!SAFE_BROWSING_KEY) {
  throw new Error("GOOGLE_API_KEY missing");
}

/**
 * Returns true if URL is SAFE
 * Returns false if URL is MALICIOUS
 */
export async function checkUrlSafeBrowsing(url: string): Promise<boolean> {
  const payload = {
    client: {
      clientId: "smart-resume-parser",
      clientVersion: "1.0.0",
    },
    threatInfo: {
      threatTypes: [
        "MALWARE",
        "SOCIAL_ENGINEERING",
        "UNWANTED_SOFTWARE",
      ],
      platformTypes: ["ANY_PLATFORM"],
      threatEntryTypes: ["URL"],
      threatEntries: [{ url }],
    },
  };

  try {
    const response = await axios.post(
      `${API_URL}?key=${SAFE_BROWSING_KEY}`,
      payload
    );

    // If matches exist → unsafe
    const hasThreats = Boolean(response.data?.matches?.length);
    console.log(response.data)
    return !hasThreats;
  } catch (error: any) {
    console.error(
      "Safe Browsing v4 API error:",
      error?.response?.data || error.message
    );

    // Business decision: fail-open
    return true;
  }
}
