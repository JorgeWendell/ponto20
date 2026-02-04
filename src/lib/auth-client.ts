import { createAuthClient } from "better-auth/react";

const getBaseURL = () => {
  if (typeof window === "undefined") {
    return (
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.BETTER_AUTH_URL ||
      "http://localhost:3000"
    );
  }
  // Sempre usa window.location.origin no cliente para funcionar com qualquer host
  return window.location.origin;
};

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
});
