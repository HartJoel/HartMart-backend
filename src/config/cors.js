const defaultOrigins = [
  "http://localhost:5173",
  "https://localhost:5173",
  "https://hart-mart-frontend.vercel.app",
];

const envOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

export const corsOptions = {
  origin(origin, callback) {
    // No Origin header means a non-browser client (Postman, curl, server-to-server) - always allow.
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true,
};
