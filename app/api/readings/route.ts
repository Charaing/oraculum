import { and, eq, desc, count } from 'drizzle-orm';
import { readings } from '../../../db/schema';
import { getDb } from '../../../db';
import { validateRecord, explainReading, RULE_VERSION } from '../../../lib/engines';
import { json, userOrNull, isSameOrigin, boundedJson, limited } from '../../../lib/server';
export const dynamic = 'force-dynamic';
export async function GET() { const user = await userOrNull(); if (!user)
    return json({ error: '기록을 보려면 로그인해 주세요.' }, 401); try {
    const rows = await getDb().select().from(readings).where(eq(readings.userId, user.userId)).orderBy(desc(readings.createdAt)).limit(1000);
    return json({ readings: rows.map(({ snapshot, ...r }) => ({ ...r, data: JSON.parse(snapshot) })) });
}
catch {
    return json({ error: '기록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.' }, 503);
} }
export async function POST(request: Request) { if (!isSameOrigin(request))
    return json({ error: '요청 출처가 올바르지 않습니다.' }, 403); const user = await userOrNull(); if (!user)
    return json({ error: '저장하려면 로그인해 주세요.' }, 401); try {
    if (!await limited(user.userId, 'save', 30))
        return json({ error: '저장 요청이 많습니다. 1분 후 시도해 주세요.' }, 429);
    const v = validateRecord(await boundedJson(request));
    const db = getDb();
    const [n] = await db.select({ value: count() }).from(readings).where(eq(readings.userId, user.userId));
    if (n.value >= 1000)
        return json({ error: '기록은 1,000개까지 저장할 수 있습니다. 기존 기록을 내보내고 정리해 주세요.' }, 409);
    const row = { id: crypto.randomUUID(), userId: user.userId, kind: v.kind, title: v.title, snapshot: JSON.stringify(v.data), explanation: explainReading(v.kind, v.data), ruleVersion: RULE_VERSION, createdAt: new Date().toISOString() };
    await db.insert(readings).values(row);
    return json({ id: row.id }, 201);
}
catch (e) {
    if (e instanceof Error && /데이터베이스|D1|SQLITE|database|query/i.test(e.message))
        return json({ error: '서버에 저장하지 못했습니다. 다시 시도해 주세요.' }, 503);
    return json({ error: e instanceof Error ? e.message : '저장하지 못했습니다.' }, 400);
} }
export async function DELETE(request: Request) { if (!isSameOrigin(request))
    return json({ error: '요청 출처가 올바르지 않습니다.' }, 403); const user = await userOrNull(); if (!user)
    return json({ error: '로그인이 필요합니다.' }, 401); try {
    const id = new URL(request.url).searchParams.get('id');
    if (!id)
        return json({ error: '기록 ID가 필요합니다.' }, 400);
    const rows = await getDb().delete(readings).where(and(eq(readings.userId, user.userId), eq(readings.id, id))).returning({ id: readings.id });
    return rows.length ? json({ deleted: true }) : json({ error: '기록을 찾을 수 없습니다.' }, 404);
}
catch {
    return json({ error: '삭제하지 못했습니다.' }, 503);
} }
