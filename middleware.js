export default function middleware(request) {
  const secret = process.env.TAILSCALE_SECRET;

  if (!secret) {
    console.error('CRITICAL: TAILSCALE_SECRET is not set — blocking all traffic.');
    return new Response(
      JSON.stringify({ error: 'Service misconfigured.' }),
      { status: 503, headers: { 'content-type': 'application/json' } }
    );
  }

  const authHeader = request.headers.get('x-tailscale-auth');
  if (authHeader !== secret) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized: Access restricted.' }),
      { status: 401, headers: { 'content-type': 'application/json' } }
    );
  }

  return new Response(null, { headers: { 'x-middleware-next': '1' } });
}

export const config = { matcher: '/(.*)' }
