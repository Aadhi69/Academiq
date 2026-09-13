import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { verifyGmailProfile } from '@/lib/email/gmail';

const EXPECTED_HOD_EMAIL = 'k.vijayakumar@klu.ac.in';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  const origin = req.nextUrl.origin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const redirectUri = `${origin}/api/auth/gmail/callback`;

  if (error) {
    return new NextResponse(
      renderCallbackHtml({
        title: 'Authorization Cancelled or Denied',
        isSuccess: false,
        message: `Google OAuth reported an error: ${error}. Please try again.`,
        origin,
      }),
      {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
        status: 400,
      }
    );
  }

  if (!code) {
    return new NextResponse(
      renderCallbackHtml({
        title: 'Missing Authorization Code',
        isSuccess: false,
        message: 'No authorization code was returned in the callback from Google.',
        origin,
      }),
      {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
        status: 400,
      }
    );
  }

  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return new NextResponse(
      renderCallbackHtml({
        title: 'Server Configuration Missing',
        isSuccess: false,
        message: 'GMAIL_CLIENT_ID or GMAIL_CLIENT_SECRET is missing from server environment variables.',
        origin,
      }),
      {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
        status: 500,
      }
    );
  }

  try {
    // Exchange authorization code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      const errMsg = tokenData.error_description || tokenData.error || 'Failed to exchange authorization code';
      return new NextResponse(
        renderCallbackHtml({
          title: 'Token Exchange Failed',
          isSuccess: false,
          message: errMsg,
          origin,
        }),
        {
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
          status: 400,
        }
      );
    }

    // Verify authorized user email identity
    const profile = await verifyGmailProfile(tokenData.access_token);
    const authorizedEmail = profile.emailAddress.toLowerCase();

    if (authorizedEmail !== EXPECTED_HOD_EMAIL.toLowerCase()) {
      return new NextResponse(
        renderCallbackHtml({
          title: 'Authorized Account Mismatch',
          isSuccess: false,
          message: `The authorized Google account (${authorizedEmail}) does not match the required HOD sender email (${EXPECTED_HOD_EMAIL}). Please re-authorize with ${EXPECTED_HOD_EMAIL}.`,
          origin,
        }),
        {
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
          status: 403,
        }
      );
    }

    // Save ONLY non-secret metadata to Firestore (NEVER the refresh token)
    if (adminDb) {
      try {
        await adminDb.doc('system/gmail_config').set(
          {
            connected: true,
            senderEmail: EXPECTED_HOD_EMAIL,
            connectedAt: new Date().toISOString(),
            provider: 'gmail_oauth2',
            scope: 'https://www.googleapis.com/auth/gmail.send',
            status: 'CONNECTED',
          },
          { merge: true }
        );
      } catch (dbErr) {
        console.warn('Note on saving non-secret metadata:', dbErr);
      }
    }

    const refreshToken = tokenData.refresh_token;

    return new NextResponse(
      renderCallbackHtml({
        title: 'Gmail Authorization Successful',
        isSuccess: true,
        message: `Successfully verified and linked Dr. K. Vijayakumar (${EXPECTED_HOD_EMAIL}).`,
        refreshToken,
        origin,
      }),
      {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
        status: 200,
      }
    );
  } catch (err: any) {
    return new NextResponse(
      renderCallbackHtml({
        title: 'Authorization Error',
        isSuccess: false,
        message: err?.message || 'An unexpected error occurred during Google OAuth.',
        origin,
      }),
      {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
        status: 500,
      }
    );
  }
}

function renderCallbackHtml(options: {
  title: string;
  isSuccess: boolean;
  message: string;
  refreshToken?: string;
  origin: string;
}) {
  const { title, isSuccess, message, refreshToken, origin } = options;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — Academiq</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #0f172a;
      color: #f8fafc;
      margin: 0;
      padding: 40px 20px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      box-sizing: border-box;
    }
    .card {
      background: #ffffff;
      color: #0f172a;
      max-width: 580px;
      width: 100%;
      border-radius: 16px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      overflow: hidden;
    }
    .header {
      background: #0f172a;
      padding: 24px 32px;
      border-bottom: 3px solid ${isSuccess ? '#10b981' : '#ef4444'};
    }
    .brand {
      font-size: 20px;
      font-weight: 800;
      color: #fff;
    }
    .content {
      padding: 32px;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      margin-bottom: 12px;
      background: ${isSuccess ? '#ecfdf5' : '#fef2f2'};
      color: ${isSuccess ? '#065f46' : '#991b1b'};
      border: 1px solid ${isSuccess ? '#a7f3d0' : '#fecaca'};
    }
    .h1 {
      font-size: 20px;
      font-weight: 700;
      margin: 0 0 12px 0;
    }
    .p {
      font-size: 14px;
      color: #475569;
      line-height: 1.5;
      margin: 0 0 20px 0;
    }
    .token-box {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: 16px;
      margin: 20px 0;
    }
    .token-label {
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    .token-text {
      font-family: monospace;
      font-size: 12px;
      word-break: break-all;
      background: #fff;
      padding: 10px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
      color: #0f172a;
      max-height: 90px;
      overflow-y: auto;
    }
    .btn {
      display: inline-block;
      background: #0f172a;
      color: #ffffff;
      text-decoration: none;
      font-weight: 600;
      font-size: 13px;
      padding: 12px 24px;
      border-radius: 8px;
      margin-top: 10px;
      cursor: pointer;
      border: none;
    }
    .btn-copy {
      background: #2563eb;
      margin-right: 8px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="brand">ACADEMI<span style="color: #ef4444;">Q</span> &bull; Gmail API OAuth</div>
    </div>
    <div class="content">
      <div class="badge">${isSuccess ? 'Verified &amp; Linked' : 'Configuration Error'}</div>
      <h1 class="h1">${title}</h1>
      <p class="p">${message}</p>

      ${isSuccess && refreshToken ? `
        <div class="token-box">
          <div class="token-label">Important: Add to Vercel Environment Variables</div>
          <div style="font-size: 12px; color: #475569; margin-bottom: 8px;">
            Copy this Refresh Token and add it as <strong>GMAIL_REFRESH_TOKEN</strong> in your Vercel Project Settings:
          </div>
          <div class="token-text" id="token">${refreshToken}</div>
          <div style="margin-top: 12px;">
            <button class="btn btn-copy" onclick="copyToken()">Copy Token to Clipboard</button>
          </div>
        </div>
      ` : ''}

      ${isSuccess && !refreshToken ? `
        <div class="token-box">
          <div style="font-size: 12px; color: #166534;">
            &check; Refresh token is already saved or configured in your environment variables.
          </div>
        </div>
      ` : ''}

      <div>
        <a href="${origin}/admin/settings" class="btn">Return to Academiq Admin Settings &rarr;</a>
      </div>
    </div>
  </div>

  <script>
    function copyToken() {
      const text = document.getElementById('token').innerText;
      navigator.clipboard.writeText(text).then(function() {
        alert('GMAIL_REFRESH_TOKEN copied to clipboard! Please paste it into your Vercel Environment Variables.');
      });
    }
  </script>
</body>
</html>
  `.trim();
}
