import { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from 'node-fetch';

export default async function handler(req = VercelRequest, res = VercelResponse) {
  const { query } = req;

  // Handle callback from GitHub
  if (req.url.startsWith('/callback')) {
    const code = query.code;
    if (!code) {
      return res.status(400).send('Missing code');
    }

    try {
      const r = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: process.env.OAUTH_CLIENT_ID,
          client_secret: process.env.OAUTH_CLIENT_SECRET,
          code,
        }),
      });
      const data = await r.json();

      if (data.error) {
        return res.status(400).json(data);
      }

      return res.json(data);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // Start auth flow → redirect to GitHub
  const redirect = `https://github.com/login/oauth/authorize?client_id=${process.env.OAUTH_CLIENT_ID}&scope=${process.env.SCOPES || 'repo'}&redirect_uri=${encodeURIComponent(
    `https://${req.headers.host}/callback`
  )}`;
  return res.redirect(302, redirect);
}
