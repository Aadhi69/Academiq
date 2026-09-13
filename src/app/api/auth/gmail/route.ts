import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const clientId = process.env.GMAIL_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json(
      {
        error: 'GMAIL_CLIENT_ID is not configured in environment variables.',
        instructions: 'Please add GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET to your environment variables.',
      },
      { status: 500 }
    );
  }

  // Derive base URL dynamically if not statically configured
  const origin = req.nextUrl.origin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const redirectUri = `${origin}/api/auth/gmail/callback`;

  const scope = encodeURIComponent('https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email');

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email');
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');
  authUrl.searchParams.set('login_hint', 'k.vijayakumar@klu.ac.in');

  return NextResponse.redirect(authUrl.toString());
}
