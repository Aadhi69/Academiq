import { NextResponse } from 'next/server';
import { getGmailConfigStatus } from '@/lib/email/gmail';
import { adminDb } from '@/lib/firebase/admin';

export async function GET() {
  const envStatus = getGmailConfigStatus();

  let firestoreStatus: any = null;
  if (adminDb) {
    try {
      const snap = await adminDb.doc('system/gmail_config').get();
      if (snap.exists) {
        firestoreStatus = snap.data();
      }
    } catch (e) {
      console.warn('Note on fetching system/gmail_config:', e);
    }
  }

  const isConnected = envStatus.isConfigured;

  return NextResponse.json({
    connected: isConnected,
    hasClientId: envStatus.hasClientId,
    hasClientSecret: envStatus.hasClientSecret,
    hasRefreshToken: envStatus.hasRefreshToken,
    senderEmail: envStatus.senderEmail,
    provider: 'gmail_oauth2',
    scope: 'https://www.googleapis.com/auth/gmail.send',
    isProduction: process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL),
    firestoreMetadata: firestoreStatus,
  });
}
