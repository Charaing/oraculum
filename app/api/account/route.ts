import { eq } from 'drizzle-orm';
import { readings } from '../../../db/schema';
import { getDb } from '../../../db';
import { json, userOrNull, isSameOrigin } from '../../../lib/server';
export async function DELETE(request: Request) { if (!isSameOrigin(request))
    return json({ error: '요청 출처 오류' }, 403); const u = await userOrNull(); if (!u)
    return json({ error: '로그인이 필요합니다.' }, 401); try {
    const db = getDb();
    await db.delete(readings).where(eq(readings.userId, u.userId));
    return json({ deleted: true });
}
catch {
    return json({ error: '전체 기록 삭제에 실패했습니다.' }, 503);
} }
