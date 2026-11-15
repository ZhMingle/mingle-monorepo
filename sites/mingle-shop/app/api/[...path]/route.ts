import { env } from 'cloudflare:workers';
import { handleShopRequest } from '../../../lib/shop-server.mjs';
export const dynamic = 'force-dynamic';
export const GET = (request: Request) => handleShopRequest(request, env, { dev: import.meta.env.DEV });
export const POST = GET;
