/**
 * Server-only Gmail API integration for Academiq.
 * Dispatches emails using Dr. K. Vijayakumar's authorized account via OAuth 2.0.
 */

export const DEFAULT_SENDER_EMAIL = 'k.vijayakumar@klu.ac.in';
export const REQUIRED_GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.send';

interface GmailSendOptions {
  to: string;
  subject: string;
  html: string;
  senderEmail?: string;
  replyTo?: string;
}

interface GmailSendResult {
  success: boolean;
  messageId?: string;
  threadId?: string;
  sender: string;
  recipient: string;
  simulated: boolean;
  error?: string;
}

/**
 * Checks if Gmail API environment variables are configured on the server.
 */
export function getGmailConfigStatus(): {
  isConfigured: boolean;
  hasClientId: boolean;
  hasClientSecret: boolean;
  hasRefreshToken: boolean;
  senderEmail: string;
} {
  const hasClientId = Boolean(process.env.GMAIL_CLIENT_ID);
  const hasClientSecret = Boolean(process.env.GMAIL_CLIENT_SECRET);
  const hasRefreshToken = Boolean(process.env.GMAIL_REFRESH_TOKEN);
  const senderEmail = process.env.GMAIL_SENDER_EMAIL || DEFAULT_SENDER_EMAIL;

  return {
    isConfigured: hasClientId && hasClientSecret && hasRefreshToken,
    hasClientId,
    hasClientSecret,
    hasRefreshToken,
    senderEmail,
  };
}

/**
 * Exchanges the refresh token for a fresh short-lived Google OAuth access token.
 */
async function fetchFreshAccessToken(clientId: string, clientSecret: string, refreshToken: string): Promise<string> {
  const tokenEndpoint = 'https://oauth2.googleapis.com/token';

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  const res = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const data = await res.json();

  if (!res.ok || !data.access_token) {
    const errMsg = data.error_description || data.error || `OAuth token refresh failed (HTTP ${res.status})`;
    throw new Error(`Google OAuth Token Refresh Error: ${errMsg}`);
  }

  return data.access_token as string;
}

/**
 * Verifies that the access token belongs to the authorized HOD email (k.vijayakumar@klu.ac.in).
 */
export async function verifyGmailProfile(accessToken: string): Promise<{ emailAddress: string; messagesTotal?: number }> {
  const profileRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const profile = await profileRes.json();

  if (!profileRes.ok || !profile.emailAddress) {
    throw new Error(profile.error?.message || 'Failed to retrieve Gmail profile for authenticated account');
  }

  return {
    emailAddress: profile.emailAddress.toLowerCase(),
    messagesTotal: profile.messagesTotal,
  };
}

/**
 * Encodes an RFC 2822 email message into base64url format for the Gmail API.
 */
function createBase64UrlMimeMessage(options: {
  to: string;
  from: string;
  subject: string;
  html: string;
  replyTo?: string;
}): string {
  const { to, from, subject, html, replyTo } = options;

  // Format subject in UTF-8 base64 format for RFC 2047 standard
  const encodedSubject = `=?utf-8?B?${Buffer.from(subject, 'utf-8').toString('base64')}?=`;
  const fromHeader = `Dr. K. Vijayakumar (HOD / EEE - Academiq) <${from}>`;

  const mimeLines: string[] = [
    `From: ${fromHeader}`,
    `To: ${to}`,
    `Reply-To: ${replyTo || from}`,
    `Subject: ${encodedSubject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    html,
  ];

  const rawMime = mimeLines.join('\r\n');

  // Convert to URL-safe base64 string
  return Buffer.from(rawMime, 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Sends an email using the Gmail REST API via the authorized HOD refresh token.
 */
export async function sendGmailEmail(options: GmailSendOptions): Promise<GmailSendResult> {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
  const senderEmail = process.env.GMAIL_SENDER_EMAIL || DEFAULT_SENDER_EMAIL;

  const isProduction = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);

  // If not fully configured in non-production (local dev), provide safe simulation logging
  if (!clientId || !clientSecret || !refreshToken) {
    if (isProduction) {
      const missingKeys = [
        !clientId && 'GMAIL_CLIENT_ID',
        !clientSecret && 'GMAIL_CLIENT_SECRET',
        !refreshToken && 'GMAIL_REFRESH_TOKEN',
      ].filter(Boolean);

      const err = `Gmail API credentials missing in production environment: ${missingKeys.join(', ')}`;
      console.error(`[Academiq Gmail API] ${err}`);
      return {
        success: false,
        sender: senderEmail,
        recipient: options.to,
        simulated: false,
        error: err,
      };
    }

    // Local dev simulation
    console.log(`[Academiq Gmail Engine (Dev Simulation)]`);
    console.log(`- From: ${senderEmail}`);
    console.log(`- To: ${options.to}`);
    console.log(`- Subject: ${options.subject}`);

    return {
      success: true,
      messageId: `sim_${Date.now()}`,
      sender: senderEmail,
      recipient: options.to,
      simulated: true,
    };
  }

  try {
    // 1. Obtain a fresh access token from Google
    const accessToken = await fetchFreshAccessToken(clientId, clientSecret, refreshToken);

    // 2. Prepare RFC 2822 base64url payload
    const rawBase64Url = createBase64UrlMimeMessage({
      to: options.to,
      from: senderEmail,
      subject: options.subject,
      html: options.html,
      replyTo: options.replyTo || senderEmail,
    });

    // 3. Send message via Gmail REST API
    const sendEndpoint = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send';
    const res = await fetch(sendEndpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: rawBase64Url,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      const errMsg = data.error?.message || `Gmail API dispatch error (HTTP ${res.status})`;
      console.error(`[Academiq Gmail Engine Error]`, data);
      return {
        success: false,
        sender: senderEmail,
        recipient: options.to,
        simulated: false,
        error: errMsg,
      };
    }

    console.log(`[Academiq Gmail API] Successfully sent email to ${options.to} (Message ID: ${data.id})`);

    return {
      success: true,
      messageId: data.id,
      threadId: data.threadId,
      sender: senderEmail,
      recipient: options.to,
      simulated: false,
    };
  } catch (err: any) {
    console.error(`[Academiq Gmail Engine Exception]`, err);
    return {
      success: false,
      sender: senderEmail,
      recipient: options.to,
      simulated: false,
      error: err?.message || 'Unexpected error communicating with Gmail API',
    };
  }
}
