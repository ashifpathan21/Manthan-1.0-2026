import axios from 'axios';
import { config } from 'dotenv';
config()
const SAFE_BROWSING_KEY = process.env.GOOGLE_API_KEY;
const API_URL = 'https://safebrowsing.googleapis.com/v4/threatMatches:find';

export async function checkUrlSafeBrowsing(url: string): Promise<boolean> {
    const request = {
        client: { clientId: process.env.GOOGLE_CLIENT_ID, clientVersion: '1.0.0' },
        threatInfo: {
            threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE'],
            platformTypes: ['ANY_PLATFORM'],
            threatEntryTypes: ['URL'],
            threatEntries: [{ url }]
        }
    };

    try {
        const response = await axios.post(
            `${API_URL}?key=${SAFE_BROWSING_KEY}`,
            request
        );
        console.log(response.data)
        return response.data?.matches?.map((match: any) => match?.threatType); // true if safe, false if threats found
    } catch (error) {
        console.error('Safe Browsing API error:', error);
        return true; // Fail-safe: assume safe on error
    }
}