export interface User {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  google_id: string | null;
  role: 'client' | 'provider' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface TokenPayload {
  sub: string;   // user id
  role: string;
  jti: string;   // unique token id for revocation
  type: 'access' | 'refresh';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface OTPRequest {
  phone: string;
}

export interface OTPVerify {
  phone: string;
  code: string;
}

export interface GoogleUserInfo {
  googleId: string;
  name: string;
  email: string;
  avatarUrl: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
        jti: string;
      };
    }
  }
}
