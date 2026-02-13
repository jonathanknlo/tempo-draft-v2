import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  console.log(`[HOOKS] ${event.request.method} ${event.url.pathname}`);
  console.log('[HOOKS] Origin:', event.request.headers.get('origin'));
  console.log('[HOOKS] Host:', event.request.headers.get('host'));
  
  const response = await resolve(event);
  
  console.log(`[HOOKS] Response status: ${response.status}`);
  
  return response;
};