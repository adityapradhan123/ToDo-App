import { csrfSync } from "csrf-sync";

export const {
  generateToken,
  csrfSynchronisedProtection,
} = csrfSync({
  getTokenFromRequest: (req) => {
    const token = req.headers["x-csrf-token"];

    return Array.isArray(token) ? token[0] : token;
  },
});