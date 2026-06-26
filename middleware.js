export default function middleware(request) {
  const authHeader = request.headers.get('x-tailscale-auth');
  const secret = process.env.TAILSCALE_SECRET;

  if (!secret) {
    console.error('CRITICAL: TAILSCALE_SECRET is not set in environment variables!');
  }

  if (authHeader !== secret) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized: Access restricted.' }),
      { status: 401, headers: { 'content-type': 'application/json' } }
    );
  }

  return new Response(null, { headers: { 'x-middleware-next': '1' } });
}

export const config = { matcher: '/(.*)' }
