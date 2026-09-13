import { NextRequest, NextResponse } from 'next/server';
import { sendGmailEmail, DEFAULT_SENDER_EMAIL } from '@/lib/email/gmail';
import {
  renderTaskAssignmentEmail,
  renderRevisionEmail,
  renderSubmissionNotificationEmail,
  renderCompletionEmail,
} from '@/lib/email/templates';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const userRoleHeader = req.headers.get('x-user-role');
    const userEmailHeader = req.headers.get('x-user-email');

    let isAuthenticated = false;
    let isHod = false;

    // Verify token with Firebase Admin
    if (adminAuth && authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      try {
        const decoded = await adminAuth.verifyIdToken(token);
        isAuthenticated = true;
        if (decoded.email === DEFAULT_SENDER_EMAIL || decoded.role === 'ADMIN' || decoded.admin === true) {
          isHod = true;
        }
      } catch (e) {
        console.warn('Firebase token verification note:', e);
      }
    }

    // Header validation fallback for authenticated app context
    if (!isAuthenticated && (userRoleHeader || userEmailHeader)) {
      isAuthenticated = true;
      if (userRoleHeader === 'ADMIN' || userEmailHeader === DEFAULT_SENDER_EMAIL) {
        isHod = true;
      }
    }

    // In development or when requested from client session
    if (!isAuthenticated) {
      // In production reject unauthenticated calls
      if (process.env.NODE_ENV === 'production' && !userRoleHeader) {
        return NextResponse.json({ error: 'Unauthorized request.' }, { status: 401 });
      }
    }

    const body = await req.json();
    const { eventType, task, recipient, assignedBy, faculty, comment, hodName, to, subject: customSubject, html: customHtml } = body;

    const origin = process.env.APP_URL || (req.nextUrl.origin !== 'null' ? req.nextUrl.origin : 'http://localhost:3000');
    let targetRecipient = to;
    let emailSubject = customSubject || '';
    let emailHtml = customHtml || '';

    // Render templates based on eventType
    switch (eventType) {
      case 'TASK_ASSIGNED': {
        if (!task || !recipient) {
          return NextResponse.json({ error: 'Missing task or recipient for TASK_ASSIGNED' }, { status: 400 });
        }
        targetRecipient = recipient.email;
        const rendered = renderTaskAssignmentEmail({
          task,
          recipient,
          assignedBy: assignedBy || { name: 'Dr. K. Vijayakumar (HOD / EEE)' },
          appUrl: origin,
        });
        emailSubject = rendered.subject;
        emailHtml = rendered.html;
        break;
      }

      case 'REVISION_REQUESTED': {
        if (!task || !recipient) {
          return NextResponse.json({ error: 'Missing task or recipient for REVISION_REQUESTED' }, { status: 400 });
        }
        targetRecipient = recipient.email;
        const rendered = renderRevisionEmail({
          task,
          recipient,
          comment: comment || 'Please review feedback and update your submission.',
          hodName: hodName || 'Dr. K. Vijayakumar (HOD / EEE)',
          appUrl: origin,
        });
        emailSubject = rendered.subject;
        emailHtml = rendered.html;
        break;
      }

      case 'SUBMISSION_RECEIVED': {
        if (!task || !faculty) {
          return NextResponse.json({ error: 'Missing task or faculty for SUBMISSION_RECEIVED' }, { status: 400 });
        }
        targetRecipient = to || process.env.GMAIL_SENDER_EMAIL || DEFAULT_SENDER_EMAIL;
        const rendered = renderSubmissionNotificationEmail({
          task,
          faculty,
          hodName: hodName || 'Dr. K. Vijayakumar',
          appUrl: origin,
        });
        emailSubject = rendered.subject;
        emailHtml = rendered.html;
        break;
      }

      case 'TASK_COMPLETED': {
        if (!task || !recipient) {
          return NextResponse.json({ error: 'Missing task or recipient for TASK_COMPLETED' }, { status: 400 });
        }
        targetRecipient = recipient.email;
        const rendered = renderCompletionEmail({
          task,
          recipient,
          hodName: hodName || 'Dr. K. Vijayakumar (HOD / EEE)',
          appUrl: origin,
        });
        emailSubject = rendered.subject;
        emailHtml = rendered.html;
        break;
      }

      default: {
        if (!targetRecipient || !emailSubject || !emailHtml) {
          return NextResponse.json(
            { error: 'Invalid payload: either a recognized eventType or to/subject/html is required.' },
            { status: 400 }
          );
        }
      }
    }

    // Dispatch via Gmail API
    const result = await sendGmailEmail({
      to: targetRecipient,
      subject: emailSubject,
      html: emailHtml,
    });

    const timestamp = new Date().toISOString();
    const logEntry = {
      taskId: task?.id || body.taskId || null,
      eventType: eventType || 'CUSTOM_NOTIFICATION',
      type: eventType || 'CUSTOM_NOTIFICATION',
      recipient: targetRecipient,
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
        console.warn('Firestore email log entry error:', dbErr);
      }
    }

    return NextResponse.json({
      success: result.success,
      simulated: result.simulated,
      messageId: result.messageId,
      log: logEntry,
      error: result.error,
    });
  } catch (err: any) {
    console.error('Email send endpoint error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Server error dispatching email' },
      { status: 500 }
    );
  }
}
