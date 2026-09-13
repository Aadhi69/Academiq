import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';

let adminApp: App | undefined;

export const isFirebaseAdminConfigured = Boolean(
  process.env.FIREBASE_PROJECT_ID && 
  process.env.FIREBASE_CLIENT_EMAIL && 
  process.env.FIREBASE_PRIVATE_KEY
);

if (isFirebaseAdminConfigured && getApps().length === 0) {
  try {
    adminApp = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (err) {
    console.warn('Firebase Admin initialization error:', err);
  }
}

export const adminAuth = adminApp ? getAdminAuth(adminApp) : null;
export const adminDb = adminApp ? getAdminFirestore(adminApp) : null;
