// src/utils/api.js
import { fetchAuthSession } from 'aws-amplify/auth';

export const API_BASE_URL = "https://lfesbjfali.execute-api.us-west-1.amazonaws.com";

export async function authenticatedFetch(url, options = {}) {
  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();

    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    };

    const response = await fetch(url, { ...options, headers });
    return response;
  } catch (error) {
    console.error("Auth Fetch Error:", error);
    throw error;
  }
}
