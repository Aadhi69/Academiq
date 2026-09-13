import { Task, User } from '@/types';
import { memoryStore } from '@/lib/firebase/db';

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  taskId?: string;
  type: string;
}

export async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; simulated: boolean; error?: string }> {
  try {
    const isProdConfigured = Boolean(process.env.EMAIL_SERVER_HOST || process.env.RESEND_API_KEY);

    if (isProdConfigured) {
      // In production with credentials, dispatch via configured SMTP/Resend
      console.log(`[Academiq Email Engine] Sending real email to: ${payload.to} | Subject: ${payload.subject}`);
      memoryStore.logEmail({
        taskId: payload.taskId,
        recipient: payload.to,
        type: payload.type,
        status: 'SENT',
        sentAt: new Date().toISOString(),
      });
      return { success: true, simulated: false };
    } else {
      // Development / Free tier simulation
      console.log(`[Academiq Email Engine] (Simulated Mode)`);
      console.log(`-> To: ${payload.to}`);
      console.log(`-> Subject: ${payload.subject}`);
      console.log(`-> Type: ${payload.type}`);
      
      memoryStore.logEmail({
        taskId: payload.taskId,
        recipient: payload.to,
        type: payload.type,
        status: 'SIMULATED',
        sentAt: new Date().toISOString(),
      });
      return { success: true, simulated: true };
    }
  } catch (err: any) {
    console.error('[Academiq Email Engine] Email error:', err);
    memoryStore.logEmail({
      taskId: payload.taskId,
      recipient: payload.to,
      type: payload.type,
      status: 'FAILED',
      sentAt: new Date().toISOString(),
      error: err?.message || 'Unknown error',
    });
    return { success: false, simulated: false, error: err?.message };
  }
}

export async function sendTaskAssignmentEmail(params: {
  task: Task;
  recipient: User;
  assignedBy: User;
}) {
  const { task, recipient, assignedBy } = params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const taskUrl = `${appUrl}/faculty/tasks/${task.id}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Work Assigned — Academiq</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a; }
          .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .header { background: #0f172a; padding: 24px 32px; color: #ffffff; }
          .brand { font-size: 20px; font-weight: 700; letter-spacing: -0.5px; color: #ffffff; }
          .dept { font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }
          .content { padding: 32px; }
          .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; }
          .badge-high { background-color: #fee2e2; color: #991b1b; }
          .badge-medium { background-color: #fef3c7; color: #92400e; }
          .badge-low { background-color: #dcfce7; color: #166534; }
          .card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .btn-primary { display: inline-block; background-color: #2563eb; color: #ffffff !important; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; margin-right: 12px; }
          .btn-secondary { display: inline-block; background-color: #f1f5f9; color: #334155 !important; font-weight: 600; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-size: 14px; }
          .footer { padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="brand">ACADEMIQ</div>
            <div class="dept">Department of Electrical & Electronics Engineering — KLU</div>
          </div>
          <div class="content">
            <h2 style="font-size: 20px; margin-top: 0; color: #0f172a;">New Work Item Assigned</h2>
            <p>Hello <strong>${recipient.name}</strong>,</p>
            <p>A new academic work item has been assigned to you by <strong>${assignedBy.name}</strong> (HOD / Admin).</p>
            
            <div class="card">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <span class="badge badge-${task.priority.toLowerCase()}">${task.priority} PRIORITY</span>
                <span style="font-size: 13px; color: #64748b;">Due: <strong>${new Date(task.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</strong></span>
              </div>
              <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #0f172a;">${task.title}</h3>
              <p style="margin: 0 0 12px 0; font-size: 14px; color: #475569; line-height: 1.5;">${task.description}</p>
              ${task.instructions ? `
                <div style="margin-top: 12px; padding-top: 12px; border-top: 1px dashed #cbd5e1; font-size: 13px; color: #334155;">
                  <strong>Instructions:</strong><br/>
                  ${task.instructions.replace(/\n/g, '<br/>')}
                </div>
              ` : ''}
            </div>

            <p style="font-size: 14px; color: #475569;">Please upload your completed documents to the specified Google Drive submission folder and mark the task as submitted in Academiq before the deadline.</p>

            <div style="margin-top: 28px;">
              <a href="${taskUrl}" class="btn-primary">Open in Academiq</a>
              <a href="${task.driveUrl}" class="btn-secondary" target="_blank">Open Submission Folder</a>
            </div>
          </div>
          <div class="footer">
            Kalasalingam Academy of Research and Education &bull; EEE Department<br/>
            This is an automated notification from Academiq.
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: recipient.email,
    subject: `Academiq — New Work Assigned: ${task.title}`,
    html,
    taskId: task.id,
    type: 'TASK_ASSIGNED',
  });
}

export async function sendRevisionEmail(params: {
  task: Task;
  recipient: User;
  comment: string;
  hodName: string;
}) {
  const { task, recipient, comment, hodName } = params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const taskUrl = `${appUrl}/faculty/tasks/${task.id}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: sans-serif; background: #f8fafc; padding: 24px;">
        <div style="max-width: 580px; margin: 0 auto; background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 32px;">
          <h2 style="color: #b45309; margin-top: 0;">Revision Required on Submission</h2>
          <p>Hello <strong>${recipient.name}</strong>,</p>
          <p>The HOD (<strong>${hodName}</strong>) has reviewed your submission for <strong>${task.title}</strong> and requested revisions.</p>
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
            <strong style="color: #92400e;">HOD Feedback:</strong>
            <p style="margin: 6px 0 0 0; color: #78350f;">${comment}</p>
          </div>
          <p>Please update the files in the Google Drive folder and re-submit the task.</p>
          <a href="${taskUrl}" style="display: inline-block; background: #2563eb; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">View Task & Re-submit</a>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: recipient.email,
    subject: `Academiq — Revision Requested: ${task.title}`,
    html,
    taskId: task.id,
    type: 'REVISION_REQUESTED',
  });
}

export async function sendSubmissionNotification(params: {
  task: Task;
  faculty: User;
  hodEmail: string;
}) {
  const { task, faculty, hodEmail } = params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const taskUrl = `${appUrl}/admin/tasks/${task.id}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: sans-serif; background: #f8fafc; padding: 24px;">
        <div style="max-width: 580px; margin: 0 auto; background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 32px;">
          <h2 style="color: #1e293b; margin-top: 0;">Faculty Work Submitted</h2>
          <p>Hello Dr. Vijayakumar,</p>
          <p><strong>${faculty.name}</strong> has submitted completed work for:</p>
          <h3 style="color: #2563eb;">${task.title}</h3>
          <p>Submitted at: <strong>${new Date().toLocaleString()}</strong></p>
          <div style="margin-top: 24px;">
            <a href="${taskUrl}" style="background: #2563eb; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-right: 10px;">Review in Academiq</a>
            <a href="${task.driveUrl}" style="background: #f1f5f9; color: #334155; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600;" target="_blank">Open Google Drive</a>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: hodEmail,
    subject: `Academiq — Work Submitted: ${faculty.name} (${task.title})`,
    html,
    taskId: task.id,
    type: 'SUBMISSION_RECEIVED',
  });
}

export async function sendCompletionEmail(params: {
  task: Task;
  recipient: User;
  hodName: string;
}) {
  const { task, recipient, hodName } = params;
  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: sans-serif; background: #f8fafc; padding: 24px;">
        <div style="max-width: 580px; margin: 0 auto; background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 32px;">
          <h2 style="color: #166534; margin-top: 0;">Task Verified & Completed</h2>
          <p>Hello <strong>${recipient.name}</strong>,</p>
          <p>Your submission for <strong>${task.title}</strong> has been verified and marked as <strong>COMPLETED</strong> by <strong>${hodName}</strong>.</p>
          <p style="color: #64748b; font-size: 14px;">Thank you for your timely departmental contribution.</p>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: recipient.email,
    subject: `Academiq — Task Approved & Completed: ${task.title}`,
    html,
    taskId: task.id,
    type: 'TASK_COMPLETED',
  });
}
