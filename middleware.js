// Automaticky vygenerovaný middleware pre Tailscale ochranu
const TAILSCALE_SECRET = process.env.TAILSCALE_SECRET || '23513900zZz#####';

export default function middleware(request) {
  const authHeader = request.headers.get('x-tailscale-auth');

  if (authHeader !== TAILSCALE_SECRET) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized: Access restricted to Tailscale network only.' }),
      { 
        status: 401, 
        headers: { 'content-type': 'application/json' } 
      }
    );
  }

  return new Response(null, {
    headers: { 'x-middleware-next': '1' }
  });
}

export const config = {
  matcher: '/(.*)',
}
