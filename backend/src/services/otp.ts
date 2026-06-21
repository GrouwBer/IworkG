import { v4 as uuidv4 } from 'uuid';
import db from '../db';
import { config } from '../config';

/**
 * Generate and store an OTP code for a phone number.
 * In production, this would send via Twilio, Vonage, or WhatsApp Business API.
 * For MVP, we log the code to console and return it (development mode).
 */
export function generateOTP(phone: string): { code: string; expiresAt: string } {
  const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
  const expiresAt = new Date(
    Date.now() + config.otpExpiryMinutes * 60 * 1000
  ).toISOString();

  // Invalidate previous unused codes for this phone
  db.prepare("UPDATE otp_codes SET used = 1 WHERE phone = ? AND used = 0").run(phone);

  // Store new code
  db.prepare(
    'INSERT INTO otp_codes (id, phone, code, expires_at) VALUES (?, ?, ?, ?)'
  ).run(uuidv4(), phone, code, expiresAt);

  // In production, send via SMS/WhatsApp here
  console.log(`\n📱 OTP for ${phone}: ${code} (expires in ${config.otpExpiryMinutes} min)\n`);

  return { code, expiresAt };
}

/**
 * Verify an OTP code for a phone number.
 * Returns true if valid and not expired.
 */
export function verifyOTP(phone: string, code: string): boolean {
  const row = db.prepare(
    `SELECT * FROM otp_codes 
     WHERE phone = ? AND code = ? AND used = 0 AND expires_at > datetime('now')
     ORDER BY created_at DESC LIMIT 1`
  ).get(phone, code) as any;

  if (!row) return false;

  // Mark as used
  db.prepare('UPDATE otp_codes SET used = 1 WHERE id = ?').run(row.id);

  // Cleanup expired codes
  db.prepare("DELETE FROM otp_codes WHERE expires_at < datetime('now')").run();

  return true;
}
