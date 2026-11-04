import { json, userOrNull } from '../../../lib/server';
export const dynamic = 'force-dynamic';
export async function GET() { const u = await userOrNull(); return json({ user: u ? { name: u.displayName } : null }); }
