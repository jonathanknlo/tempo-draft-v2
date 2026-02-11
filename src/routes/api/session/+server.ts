import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies }) => {
  const { roomId, sessionId } = await request.json();
  
  cookies.set(`tempo-${roomId}`, sessionId, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  });
  
  return new Response(JSON.stringify({ success: true }));
};
