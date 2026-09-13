import { Task, User } from '@/types';

interface BaseTemplateOptions {
  preheader?: string;
  badgeText?: string;
  badgeColor?: 'blue' | 'red' | 'amber' | 'emerald' | 'purple';
  heading: string;
  subheading?: string;
  bodyHtml: string;
  primaryAction?: {
    label: string;
    url: string;
  };
  secondaryAction?: {
    label: string;
    url: string;
  };
  footerNote?: string;
}

function getBadgeStyles(color: BaseTemplateOptions['badgeColor'] = 'blue'): { bg: string; text: string; border: string } {
  switch (color) {
    case 'red':
      return { bg: '#fef2f2', text: '#991b1b', border: '#fecaca' };
    case 'amber':
      return { bg: '#fffbeb', text: '#92400e', border: '#fde68a' };
    case 'emerald':
      return { bg: '#f0fdf4', text: '#166534', border: '#bbf7d0' };
    case 'purple':
      return { bg: '#faf5ff', text: '#6b21a8', border: '#e9d5ff' };
    case 'blue':
    default:
      return { bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe' };
  }
}

export function renderBaseEmailLayout(options: BaseTemplateOptions): string {
  const badgeStyle = getBadgeStyles(options.badgeColor);
  const currentYear = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.heading}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      color: #0f172a;
    }
    table {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    td {
      padding: 0;
    }
    img {
      border: 0;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }
    a {
      color: #2563eb;
      text-decoration: none;
    }
    @media only screen and (max-width: 620px) {
      .email-container {
        width: 100% !important;
        margin: 0 !important;
        border-radius: 0 !important;
      }
      .email-body {
        padding: 24px 20px !important;
      }
      .email-header {
        padding: 24px 20px !important;
      }
      .email-actions {
        display: block !important;
        width: 100% !important;
      }
      .btn {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
        text-align: center !important;
        margin-bottom: 10px !important;
      }
    }
  </style>
</head>
<body style="background-color: #f8fafc; margin: 0; padding: 24px 0;">
  ${options.preheader ? `
    <div style="display: none; max-height: 0px; overflow: hidden;">
      ${options.preheader}
      &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
    </div>
  ` : ''}

  <center>
    <table role="presentation" class="email-container" width="600" style="max-width: 600px; width: 100%; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.05);">
      
      <!-- Brand Header -->
      <tr>
        <td class="email-header" style="background-color: #0f172a; padding: 28px 36px; border-bottom: 3px solid #dc2626;">
          <table role="presentation" width="100%">
            <tr>
              <td>
                <div style="font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">
                  ACADEMI<span style="color: #ef4444;">Q</span>
                </div>
                <div style="font-size: 11px; color: #94a3b8; font-weight: 500; text-transform: uppercase; letter-spacing: 0.8px; margin-top: 4px;">
                  Department of Electrical &amp; Electronics Engineering
                </div>
              </td>
              <td align="right" style="font-size: 11px; color: #cbd5e1; font-weight: 600; letter-spacing: 0.5px;">
                KARE &bull; KLU
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Main Content -->
      <tr>
        <td class="email-body" style="padding: 36px 36px 28px 36px;">
          
          <!-- Event Badge -->
          ${options.badgeText ? `
            <table role="presentation" style="margin-bottom: 16px;">
              <tr>
                <td style="background-color: ${badgeStyle.bg}; border: 1px solid ${badgeStyle.border}; color: ${badgeStyle.text}; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; padding: 4px 12px; border-radius: 9999px;">
                  ${options.badgeText}
                </td>
              </tr>
            </table>
          ` : ''}

          <!-- Heading -->
          <h1 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 700; color: #0f172a; line-height: 1.3;">
            ${options.heading}
          </h1>

          ${options.subheading ? `
            <p style="margin: 0 0 24px 0; font-size: 14px; color: #64748b; line-height: 1.5;">
              ${options.subheading}
            </p>
          ` : '<div style="height: 16px;"></div>'}

          <!-- Body HTML -->
          <div style="font-size: 14px; color: #334155; line-height: 1.6;">
            ${options.bodyHtml}
          </div>

          <!-- Action Buttons -->
          ${options.primaryAction || options.secondaryAction ? `
            <table role="presentation" class="email-actions" style="margin-top: 32px; width: 100%;">
              <tr>
                <td style="padding-top: 8px;">
                  ${options.primaryAction ? `
                    <a href="${options.primaryAction.url}" class="btn" style="display: inline-block; background-color: #0f172a; color: #ffffff !important; text-decoration: none; font-weight: 600; font-size: 13px; padding: 12px 24px; border-radius: 8px; margin-right: 12px; border: 1px solid #0f172a;">
                      ${options.primaryAction.label} &rarr;
                    </a>
                  ` : ''}
                  ${options.secondaryAction ? `
                    <a href="${options.secondaryAction.url}" class="btn" target="_blank" style="display: inline-block; background-color: #f1f5f9; color: #334155 !important; text-decoration: none; font-weight: 600; font-size: 13px; padding: 12px 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
                      ${options.secondaryAction.label}
                    </a>
                  ` : ''}
                </td>
              </tr>
            </table>
          ` : ''}

        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 36px;">
          <table role="presentation" width="100%">
            <tr>
              <td style="font-size: 12px; color: #64748b; line-height: 1.5;">
                <strong>Dr. K. Vijayakumar</strong><br/>
                Associate Professor &amp; Head &bull; Department of Electrical &amp; Electronics Engineering<br/>
                Kalasalingam Academy of Research and Education (KARE), Anand Nagar, Krishnankoil
              </td>
            </tr>
            <tr>
              <td style="padding-top: 14px; font-size: 11px; color: #94a3b8; border-top: 1px dashed #e2e8f0; margin-top: 14px;">
                ${options.footerNote || 'This is an automated departmental notification dispatched by Academiq via the official HOD Gmail API integration.'}
                &bull; &copy; ${currentYear} Academiq
              </td>
            </tr>
          </table>
        </td>
      </tr>

    </table>
  </center>
</body>
</html>
  `.trim();
}

/**
 * 1. Task Assignment Email Template
 */
export function renderTaskAssignmentEmail(params: {
  task: Task;
  recipient: User;
  assignedBy: User;
  appUrl: string;
}): { subject: string; html: string } {
  const { task, recipient, assignedBy, appUrl } = params;
  const taskUrl = `${appUrl}/faculty/tasks/${task.id}`;
  const formattedDue = new Date(task.dueDate).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const priorityColor = task.priority === 'HIGH' ? 'red' : task.priority === 'MEDIUM' ? 'amber' : 'emerald';

  const bodyHtml = `
    <p style="margin: 0 0 16px 0;">
      Dear <strong>${recipient.name}</strong> (${recipient.designation || 'Faculty Member'}),
    </p>
    <p style="margin: 0 0 20px 0; color: #475569;">
      A new academic work deliverable has been assigned to you by <strong>${assignedBy.name}</strong> (HOD / EEE). Please review the requirements below:
    </p>

    <!-- Task Spec Card -->
    <table role="presentation" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 20px;">
      <tr>
        <td style="padding: 20px;">
          <table role="presentation" width="100%">
            <tr>
              <td style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">
                Deliverable Title
              </td>
              <td align="right">
                <span style="font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px; background: ${task.priority === 'HIGH' ? '#fee2e2' : task.priority === 'MEDIUM' ? '#fef3c7' : '#dcfce7'}; color: ${task.priority === 'HIGH' ? '#991b1b' : task.priority === 'MEDIUM' ? '#92400e' : '#166534'};">
                  ${task.priority} PRIORITY
                </span>
              </td>
            </tr>
            <tr>
              <td colspan="2" style="padding-top: 6px; font-size: 16px; font-weight: 700; color: #0f172a;">
                ${task.title}
              </td>
            </tr>
            <tr>
              <td colspan="2" style="padding-top: 10px; font-size: 13px; color: #475569; line-height: 1.5;">
                ${task.description}
              </td>
            </tr>
            <tr>
              <td colspan="2" style="padding-top: 16px; border-top: 1px dashed #cbd5e1; margin-top: 14px;">
                <table role="presentation" width="100%">
                  <tr>
                    <td style="font-size: 12px; color: #64748b;">
                      <strong>Submission Deadline:</strong> <span style="color: #0f172a; font-weight: 600;">${formattedDue}</span>
                    </td>
                    <td align="right" style="font-size: 12px; color: #64748b;">
                      <strong>Status:</strong> <span style="color: #2563eb; font-weight: 600;">PENDING</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            ${task.instructions ? `
              <tr>
                <td colspan="2" style="padding-top: 14px; border-top: 1px dashed #cbd5e1; margin-top: 14px;">
                  <div style="font-size: 11px; font-weight: 700; color: #0f172a; text-transform: uppercase; margin-bottom: 6px;">
                    Step-by-Step Instructions:
                  </div>
                  <div style="font-size: 13px; color: #334155; line-height: 1.5; background: #ffffff; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
                    ${task.instructions.replace(/\n/g, '<br/>')}
                  </div>
                </td>
              </tr>
            ` : ''}
          </table>
        </td>
      </tr>
    </table>

    <p style="margin: 0; font-size: 13px; color: #64748b;">
      Please prepare the required documents, upload them to the designated Google Drive folder, and click <strong>Submit</strong> in Academiq before the deadline.
    </p>
  `;

  const html = renderBaseEmailLayout({
    preheader: `New task assigned: ${task.title} (Due: ${formattedDue})`,
    badgeText: 'New Work Assignment',
    badgeColor: priorityColor,
    heading: task.title,
    subheading: `Assigned by ${assignedBy.name} • Due ${formattedDue}`,
    bodyHtml,
    primaryAction: {
      label: 'Open Task in Academiq',
      url: taskUrl,
    },
    secondaryAction: task.driveUrl ? {
      label: 'Open Google Drive Folder',
      url: task.driveUrl,
    } : undefined,
  });

  return {
    subject: `[Academiq] New Assignment: ${task.title} (${task.priority} Priority)`,
    html,
  };
}

/**
 * 2. Revision Request Email Template
 */
export function renderRevisionEmail(params: {
  task: Task;
  recipient: User;
  comment: string;
  hodName: string;
  appUrl: string;
}): { subject: string; html: string } {
  const { task, recipient, comment, hodName, appUrl } = params;
  const taskUrl = `${appUrl}/faculty/tasks/${task.id}`;

  const bodyHtml = `
    <p style="margin: 0 0 16px 0;">
      Dear <strong>${recipient.name}</strong>,
    </p>
    <p style="margin: 0 0 20px 0; color: #475569;">
      The Head of Department (<strong>${hodName}</strong>) has reviewed your submission for <strong>${task.title}</strong> and requested revisions before approval.
    </p>

    <!-- Revision Comment Box -->
    <table role="presentation" width="100%" style="background-color: #fffbeb; border: 1px solid #fde68a; border-left: 4px solid #f59e0b; border-radius: 8px; margin-bottom: 20px;">
      <tr>
        <td style="padding: 16px;">
          <div style="font-size: 11px; font-weight: 700; color: #92400e; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
            HOD Revision Feedback &amp; Instructions:
          </div>
          <div style="font-size: 14px; color: #78350f; line-height: 1.5; font-style: italic;">
            &ldquo;${comment}&rdquo;
          </div>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 12px 0; font-size: 13px; color: #475569;">
      Please address the feedback, update your files in the Google Drive folder, and re-submit the deliverable in Academiq.
    </p>
  `;

  const html = renderBaseEmailLayout({
    preheader: `Revision requested on: ${task.title}`,
    badgeText: 'Action Required: Revision',
    badgeColor: 'amber',
    heading: `Revision Requested: ${task.title}`,
    subheading: `Please review comments from ${hodName} and update your submission.`,
    bodyHtml,
    primaryAction: {
      label: 'View Task & Re-submit',
      url: taskUrl,
    },
    secondaryAction: task.driveUrl ? {
      label: 'Open Google Drive Folder',
      url: task.driveUrl,
    } : undefined,
  });

  return {
    subject: `[Academiq] Revision Requested: ${task.title}`,
    html,
  };
}

/**
 * 3. Faculty Submission Notification Email Template (To HOD)
 */
export function renderSubmissionNotificationEmail(params: {
  task: Task;
  faculty: User;
  hodName: string;
  appUrl: string;
}): { subject: string; html: string } {
  const { task, faculty, hodName, appUrl } = params;
  const adminTaskUrl = `${appUrl}/admin/tasks/${task.id}`;
  const submittedTime = new Date().toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const bodyHtml = `
    <p style="margin: 0 0 16px 0;">
      Respected <strong>${hodName}</strong>,
    </p>
    <p style="margin: 0 0 20px 0; color: #475569;">
      <strong>${faculty.name}</strong> (${faculty.designation || 'Faculty Member'}) has submitted completed work for the deliverable:
    </p>

    <!-- Submission Details Card -->
    <table role="presentation" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 20px;">
      <tr>
        <td style="padding: 20px;">
          <div style="font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 8px;">
            ${task.title}
          </div>
          <div style="font-size: 13px; color: #475569; margin-bottom: 12px;">
            ${task.description}
          </div>
          <table role="presentation" width="100%" style="border-top: 1px dashed #cbd5e1; padding-top: 12px;">
            <tr>
              <td style="font-size: 12px; color: #64748b;">
                <strong>Submitted By:</strong> ${faculty.name} (${faculty.email})<br/>
                <strong>Submission Time:</strong> ${submittedTime}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin: 0; font-size: 13px; color: #64748b;">
      You can review the uploaded documents in the Google Drive folder and approve or request revision directly from the Academiq portal.
    </p>
  `;

  const html = renderBaseEmailLayout({
    preheader: `Submission from ${faculty.name}: ${task.title}`,
    badgeText: 'Deliverable Submitted',
    badgeColor: 'purple',
    heading: `Work Submitted: ${faculty.name}`,
    subheading: `Deliverable ready for your review & approval.`,
    bodyHtml,
    primaryAction: {
      label: 'Review in Academiq',
      url: adminTaskUrl,
    },
    secondaryAction: task.driveUrl ? {
      label: 'Open Google Drive Folder',
      url: task.driveUrl,
    } : undefined,
  });

  return {
    subject: `[Academiq] Submission Received: ${faculty.name} — ${task.title}`,
    html,
  };
}

/**
 * 4. Task Completed & Approved Email Template
 */
export function renderCompletionEmail(params: {
  task: Task;
  recipient: User;
  hodName: string;
  appUrl: string;
}): { subject: string; html: string } {
  const { task, recipient, hodName, appUrl } = params;
  const taskUrl = `${appUrl}/faculty/tasks/${task.id}`;

  const bodyHtml = `
    <p style="margin: 0 0 16px 0;">
      Dear <strong>${recipient.name}</strong>,
    </p>
    <p style="margin: 0 0 20px 0; color: #475569;">
      Your submission for <strong>${task.title}</strong> has been inspected, verified, and officially marked as <strong style="color: #166534;">COMPLETED</strong> by <strong>${hodName}</strong> (HOD / EEE).
    </p>

    <!-- Completion Success Card -->
    <table role="presentation" width="100%" style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; margin-bottom: 20px;">
      <tr>
        <td style="padding: 20px;">
          <div style="font-size: 15px; font-weight: 700; color: #166534; margin-bottom: 6px;">
            &check; Deliverable Verified &amp; Accepted
          </div>
          <div style="font-size: 13px; color: #15803d; line-height: 1.5;">
            Thank you for your timely and diligent contribution to departmental deliverables and compliance.
          </div>
        </td>
      </tr>
    </table>
  `;

  const html = renderBaseEmailLayout({
    preheader: `Task completed and approved: ${task.title}`,
    badgeText: 'Task Approved',
    badgeColor: 'emerald',
    heading: `Task Approved: ${task.title}`,
    subheading: `Verified and closed by ${hodName}.`,
    bodyHtml,
    primaryAction: {
      label: 'View in Academiq',
      url: taskUrl,
    },
  });

  return {
    subject: `[Academiq] Task Approved & Completed: ${task.title}`,
    html,
  };
}

/**
 * 5. Test Email Verification Template
 */
export function renderTestEmail(params: {
  recipientEmail: string;
  senderEmail: string;
  timestamp: string;
  appUrl: string;
}): { subject: string; html: string } {
  const { recipientEmail, senderEmail, timestamp, appUrl } = params;

  const bodyHtml = `
    <p style="margin: 0 0 16px 0;">
      Hello Dr. Vijayakumar,
    </p>
    <p style="margin: 0 0 20px 0; color: #475569;">
      This is a test notification verifying that the <strong>Gmail API integration</strong> for Academiq is functioning seamlessly.
    </p>

    <!-- Test Diagnostics Box -->
    <table role="presentation" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 20px;">
      <tr>
        <td style="padding: 20px; font-size: 12px; font-family: monospace; color: #334155; line-height: 1.8;">
          <strong>&bull; Authenticated Sender:</strong> ${senderEmail}<br/>
          <strong>&bull; Target Recipient:</strong> ${recipientEmail}<br/>
          <strong>&bull; OAuth Scope:</strong> https://www.googleapis.com/auth/gmail.send<br/>
          <strong>&bull; Dispatch Timestamp:</strong> ${timestamp}<br/>
          <strong>&bull; Integration Status:</strong> <span style="color: #166534; font-weight: bold;">LIVE &amp; OPERATIONAL</span>
        </td>
      </tr>
    </table>

    <p style="margin: 0; font-size: 13px; color: #64748b;">
      All automated task assignments, revision alerts, submissions, and completion notices will now be dispatched automatically through this Gmail pipeline.
    </p>
  `;

  const html = renderBaseEmailLayout({
    preheader: 'Academiq Gmail API test dispatch successful',
    badgeText: 'Integration Test',
    badgeColor: 'emerald',
    heading: 'Gmail API Integration Active',
    subheading: 'Official test dispatch from Dr. K. Vijayakumar (HOD / EEE)',
    bodyHtml,
    primaryAction: {
      label: 'Open Academiq Settings',
      url: `${appUrl}/admin/settings`,
    },
  });

  return {
    subject: `[Academiq] Gmail API Integration Test & Verification (${new Date(timestamp).toLocaleDateString()})`,
    html,
  };
}
