import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  jwtExpiresIn: '24h',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/auth/google/callback',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  otpExpiryMinutes: 5,
};
