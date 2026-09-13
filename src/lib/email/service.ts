import { Task, User, EmailLog } from '@/types';
import { memoryStore } from '@/lib/firebase/db';

interface SendEventPayload {
  eventType: 'TASK_ASSIGNED' | 'REVISION_REQUESTED' | 'SUBMISSION_RECEIVED' | 'TASK_COMPLETED' | 'TEST_EMAIL';
  taskId?: string;
  task?: Task;
  recipient?: User;
  assignedBy?: User;
  faculty?: User;
  comment?: string;
  hodName?: string;
  to?: string;
  subject?: string;
  html?: string;
}

/**
 * Dispatches an email event to the server-side Gmail pipeline.
 * Non-blocking: will never crash or fail the calling application flow.
 */
export async function dispatchEmailEvent(payload: SendEventPayload): Promise<{
  success: boolean;
  simulated: boolean;
  error?: string;
}> {
  try {
    const isBrowser = typeof window !== 'undefined';
    const baseUrl = isBrowser ? '' : (process.env.APP_URL || 'http://localhost:3000');

    const currentUser = isBrowser ? memoryStore.getUsers().find((u) => u.role === 'ADMIN') : null;

    const res = await fetch(`${baseUrl}/api/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(currentUser?.role ? { 'x-user-role': currentUser.role } : {}),
        ...(currentUser?.email ? { 'x-user-email': currentUser.email } : {}),
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    const timestamp = new Date().toISOString();
    const recipientEmail = payload.recipient?.email || payload.to || (payload.eventType === 'SUBMISSION_RECEIVED' ? 'k.vijayakumar@klu.ac.in' : 'recipient@klu.ac.in');

    const logEntry: Omit<EmailLog, 'id'> = {
      taskId: payload.taskId || payload.task?.id,
      eventType: payload.eventType,
      type: payload.eventType,
      recipient: recipientEmail,
      sender: 'k.vijayakumar@klu.ac.in',
      timestamp,
      sentAt: timestamp,
      status: data.success ? (data.simulated ? 'SIMULATED' : 'SENT') : 'FAILED',
      errorMessage: data.error || (data.success ? undefined : 'Email send failed'),
      error: data.error,
      messageId: data.messageId,
    };

    memoryStore.logEmail(logEntry);

    return {
      success: Boolean(data.success),
      simulated: Boolean(data.simulated),
      error: data.error,
    };
  } catch (err: any) {
    console.warn('[Academiq Email Engine] Non-blocking dispatch notice:', err?.message);

    const timestamp = new Date().toISOString();
    const recipientEmail = payload.recipient?.email || payload.to || 'recipient@klu.ac.in';

    memoryStore.logEmail({
      taskId: payload.taskId || payload.task?.id,
      eventType: payload.eventType,
      type: payload.eventType,
      recipient: recipientEmail,
      sender: 'k.vijayakumar@klu.ac.in',
      timestamp,
      sentAt: timestamp,
      status: 'FAILED',
      errorMessage: err?.message || 'Network dispatch error',
      error: err?.message,
    });

    return {
      success: false,
      simulated: false,
      error: err?.message || 'Failed to dispatch email',
    };
  }
}

/**
 * 1. Task Assignment Email Notification
 */
export async function sendTaskAssignmentEmail(params: {
  task: Task;
  recipient: User;
  assignedBy: User;
}) {
  return dispatchEmailEvent({
    eventType: 'TASK_ASSIGNED',
    taskId: params.task.id,
    task: params.task,
    recipient: params.recipient,
    assignedBy: params.assignedBy,
  });
}

/**
 * 2. Revision Requested Email Notification
 */
export async function sendRevisionEmail(params: {
  task: Task;
  recipient: User;
  comment: string;
  hodName: string;
}) {
  return dispatchEmailEvent({
    eventType: 'REVISION_REQUESTED',
    taskId: params.task.id,
    task: params.task,
    recipient: params.recipient,
    comment: params.comment,
    hodName: params.hodName,
  });
}

/**
 * 3. Faculty Submission Email Notification (to HOD)
 */
export async function sendSubmissionNotification(params: {
  task: Task;
  faculty: User;
  hodEmail?: string;
}) {
  return dispatchEmailEvent({
    eventType: 'SUBMISSION_RECEIVED',
    taskId: params.task.id,
    task: params.task,
    faculty: params.faculty,
    to: params.hodEmail || 'k.vijayakumar@klu.ac.in',
  });
}

/**
 * 4. Task Completed & Approved Email Notification
 */
export async function sendCompletionEmail(params: {
  task: Task;
  recipient: User;
  hodName: string;
}) {
  return dispatchEmailEvent({
    eventType: 'TASK_COMPLETED',
    taskId: params.task.id,
    task: params.task,
    recipient: params.recipient,
    hodName: params.hodName,
  });
}

/**
 * Generic email sender for backward compatibility
 */
export async function sendEmail(payload: {
  to: string;
  subject: string;
  html: string;
  taskId?: string;
  type?: string;
}) {
  return dispatchEmailEvent({
    eventType: (payload.type as any) || 'TEST_EMAIL',
    taskId: payload.taskId,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
  });
}
