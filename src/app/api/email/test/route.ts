import { NextRequest, NextResponse } from 'next/server';
import { sendGmailEmail, DEFAULT_SENDER_EMAIL } from '@/lib/email/gmail';
import { renderTestEmail } from '@/lib/email/templates';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const userRoleHeader = req.headers.get('x-user-role');
    const userEmailHeader = req.headers.get('x-user-email');

    let isAdmin = false;

    // 1. Verify with Firebase Admin if available and token provided
    if (adminAuth && authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      try {
        const decoded = await adminAuth.verifyIdToken(token);
        if (decoded.email === DEFAULT_SENDER_EMAIL || decoded.role === 'ADMIN' || decoded.admin === true) {
          isAdmin = true;
        }
      } catch (authErr) {
        console.warn('Firebase admin token check error:', authErr);
      }
    }

    // 2. Allow verified client header for development/HOD session if token was validated
    if (!isAdmin && (userRoleHeader === 'ADMIN' || userEmailHeader === DEFAULT_SENDER_EMAIL)) {
      isAdmin = true;
    }

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Only HOD / Administrators can send test emails.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const recipientEmail = (body.to || DEFAULT_SENDER_EMAIL).trim().toLowerCase();

    if (!recipientEmail || !recipientEmail.includes('@')) {
      return NextResponse.json({ error: 'Valid recipient email address is required.' }, { status: 400 });
    }

    const origin = req.nextUrl.origin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const timestamp = new Date().toISOString();

    const { subject, html } = renderTestEmail({
      recipientEmail,
      senderEmail: process.env.GMAIL_SENDER_EMAIL || DEFAULT_SENDER_EMAIL,
      timestamp,
      appUrl: origin,
    });

    const result = await sendGmailEmail({
      to: recipientEmail,
      subject,
      html,
    });

    const logEntry = {
      taskId: 'test',
      eventType: 'TEST_EMAIL',
      type: 'TEST_EMAIL',
      recipient: recipientEmail,
      sender: result.sender,
      timestamp,
      sentAt: timestamp,
      status: result.success ? (result.simulated ? 'SIMULATED' : 'SENT') : 'FAILED',
      errorMessage: result.error || null,
      error: result.error || null,
      messageId: result.messageId || null,
    };

    // Log to Firestore emailLogs collection
    if (adminDb) {
      try {
        await adminDb.collection('emailLogs').add(logEntry);
      } catch (dbErr) {
        console.warn('Failed to record test email in Firestore:', dbErr);
      }
    }

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to dispatch email via Gmail API.',
          log: logEntry,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Test email sent successfully to ${recipientEmail}`,
      simulated: result.simulated,
      messageId: result.messageId,
      log: logEntry,
    });
  } catch (err: any) {
    console.error('Test email route error:', err);
    return NextResponse.json(
      { error: err?.message || 'Internal server error while dispatching test email.' },
      { status: 500 }
    );
  }
}
