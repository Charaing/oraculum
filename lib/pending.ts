import { validateRecord } from './engines.ts';
export function makePendingReading(reading: unknown, now = Date.now()) { const record = validateRecord(reading); return JSON.stringify({ record, expiresAt: now + 30 * 60000 }); }
export function parsePendingReading(raw: string, now = Date.now()) { if (raw.length > 55000)
    throw new Error('임시 기록 크기 오류'); const value = JSON.parse(raw); if (!Number.isFinite(value.expiresAt) || value.expiresAt < now || value.expiresAt > now + 30 * 60000)
    throw new Error('임시 기록이 만료되었습니다.'); return validateRecord(value.record); }
