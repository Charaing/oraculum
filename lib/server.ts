import { getChatGPTUser } from '../app/chatgpt-auth';
import { env } from 'cloudflare:workers';
export const privateHeaders = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
export function json(data: unknown, status = 200) { return Response.json(data, { status, headers: privateHeaders }); }
export function isSameOrigin(request: Request) { const origin = request.headers.get('origin'); return !!origin && origin === new URL(request.url).origin; }
export async function userOrNull() { return getChatGPTUser(); }
export async function limited(user: string, action: string, max: number) { const window = Math.floor(Date.now() / 60000); if (!env.DB)
    throw new Error('데이터베이스를 사용할 수 없습니다.'); const row = await env.DB.prepare('INSERT INTO rate_limits (key, window, count) VALUES (?, ?, 1) ON CONFLICT(key) DO UPDATE SET count = CASE WHEN window = excluded.window THEN count + 1 ELSE 1 END, window = excluded.window RETURNING count').bind(`${user}:${action}`, window).first<{
    count: number;
}>(); return !!row && row.count <= max; }
export async function boundedJson(request: Request) { if (Number(request.headers.get('content-length') || 0) > 60000)
    throw new Error('입력 크기가 너무 큽니다.'); const reader = request.body?.getReader(); if (!reader)
    throw new Error('입력이 없습니다.'); let size = 0; const chunks: Uint8Array[] = []; for (;;) {
    const { done, value } = await reader.read();
    if (done)
        break;
    size += value.byteLength;
    if (size > 60000) {
        await reader.cancel();
        throw new Error('입력 크기가 너무 큽니다.');
    }
    chunks.push(value);
} const out = new Uint8Array(size); let at = 0; chunks.forEach(c => { out.set(c, at); at += c.length; }); return JSON.parse(new TextDecoder().decode(out)); }
