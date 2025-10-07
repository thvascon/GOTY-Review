import { NextRequest, NextResponse } from 'next/server';

const CLIENT_ID = '1bbs6pu72znsra0ufgbtbqymfht9me';
const CLIENT_SECRET = 'y6fi0zrsokud0xyv67huotjd1brvbu';

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const response = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'client_credentials',
    }),
  });

  const data = await response.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in * 900);

  return cachedToken;
}

export async function POST(request: NextRequest) {
  try {
    const { endpoint, body } = await request.json();

    const token = await getAccessToken();

    const response = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
      method: 'POST',
      headers: {
        'Client-ID': CLIENT_ID,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'text/plain',
      },
      body: body,
    });

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('IGDB API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch from IGDB' }, { status: 500 });
  }
}
