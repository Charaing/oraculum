import lunar from 'lunar-javascript';
import * as Astronomy from 'astronomy-engine';
import { TAROT, HEXAGRAMS, type TarotCard } from './catalog.ts';
const { Solar } = lunar;
export type Kind = 'tarot' | 'saju' | 'iching' | 'astrology';
export type ReadingData = Record<string, any>;
export const RULE_VERSION = 'oraculum-1.0.0';
export function secureIndex(max: number) { if (!Number.isInteger(max) || max < 1 || max > 2 ** 32)
    throw new Error('난수 범위 오류'); const a = new Uint32Array(1); const limit = Math.floor(2 ** 32 / max) * max; do {
    crypto.getRandomValues(a);
} while (a[0] >= limit); return a[0] % max; }
export function drawTarot(count: number, rng: (max: number) => number = secureIndex) { if (!Number.isInteger(count) || count < 1 || count > 78)
    throw new Error('1–78장의 카드를 선택하세요.'); const deck = [...TAROT]; return Array.from({ length: count }, () => { const i = rng(deck.length); if (i < 0 || i >= deck.length || !Number.isInteger(i))
    throw new Error('난수 오류'); return { card: deck.splice(i, 1)[0], reversed: rng(2) === 1 }; }); }
export function hexagramFromLines(lines: number[]) { if (lines.length !== 6 || lines.some(n => ![6, 7, 8, 9].includes(n)))
    throw new Error('아래에서 위로 여섯 효(6·7·8·9)를 입력하세요.'); const bits = lines.map(n => n % 2 ? '1' : '0').join(''); const changedBits = lines.map(n => n === 6 ? '1' : n === 9 ? '0' : n % 2 ? '1' : '0').join(''); return { lines: [...lines], original: HEXAGRAMS.find(h => h.bits === bits)!, changed: HEXAGRAMS.find(h => h.bits === changedBits)!, moving: lines.flatMap((n, i) => n === 6 || n === 9 ? [i + 1] : []), engine: RULE_VERSION, rules: '동전 앞=3·뒤=2; 6·9 변효; 효는 아래에서 위로 기록' }; }
export function tossLine() { const coins = Array.from({ length: 3 }, () => secureIndex(2) + 2); return { coins, value: coins.reduce((a, b) => a + b, 0) }; }
export function validDateTime(date: string, time: string, minYear = 1962) { if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time))
    throw new Error('날짜와 시간을 정확히 입력하세요.'); const [y, m, d] = date.split('-').map(Number), [h, mm] = time.split(':').map(Number); const check = new Date(Date.UTC(y, m - 1, d)); if (y < minYear || y > 2099 || check.getUTCFullYear() !== y || check.getUTCMonth() !== m - 1 || check.getUTCDate() !== d || h > 23 || mm > 59)
    throw new Error(`${minYear}–2099년의 유효한 날짜와 시간을 입력하세요.`); return { y, m, d, h, mm }; }
export type SajuInput = {
    date: string;
    time: string;
    calendar: 'solar';
    sect: 1 | 2;
};
const readings: Record<string, string> = { 甲: '갑', 乙: '을', 丙: '병', 丁: '정', 戊: '무', 己: '기', 庚: '경', 辛: '신', 壬: '임', 癸: '계', 子: '자', 丑: '축', 寅: '인', 卯: '묘', 辰: '진', 巳: '사', 午: '오', 未: '미', 申: '신', 酉: '유', 戌: '술', 亥: '해' };
const elementMap: Record<string, string> = { 甲: '목', 乙: '목', 丙: '화', 丁: '화', 戊: '토', 己: '토', 庚: '금', 辛: '금', 壬: '수', 癸: '수', 子: '수', 丑: '토', 寅: '목', 卯: '목', 辰: '토', 巳: '화', 午: '화', 未: '토', 申: '금', 酉: '금', 戌: '토', 亥: '수' };
export function calculateSaju(input: SajuInput) { input = { date: input?.date, time: input?.time, calendar: input?.calendar, sect: input?.sect }; if (input.calendar !== 'solar' || ![1, 2].includes(input.sect))
    throw new Error('이번 버전은 양력과 자시 경계 1·2만 지원합니다.'); const { y, m, d, h, mm } = validDateTime(input.date, input.time); const local = Solar.fromYmdHms(y, m, d, h, mm, 0).getLunar().getEightChar(); local.setSect(input.sect); const cst = new Date(Date.UTC(y, m - 1, d, h - 1, mm)); const terms = Solar.fromYmdHms(cst.getUTCFullYear(), cst.getUTCMonth() + 1, cst.getUTCDate(), cst.getUTCHours(), cst.getUTCMinutes(), 0).getLunar().getEightChar(); const values = [terms.getYear(), terms.getMonth(), local.getDay(), local.getTime()]; const elements: Record<string, number> = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 }; values.join('').split('').forEach(ch => elements[elementMap[ch]]++); const stems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']; return { input, pillars: values.map((hanja, i) => ({ label: ['연주', '월주', '일주', '시주'][i], hanja, korean: [...hanja].map(c => readings[c]).join(''), elements: [...hanja].map(c => elementMap[c]), polarity: stems.indexOf(hanja[0]) % 2 === 0 ? '양' : '음' })), elements, dayMaster: { hanja: values[2][0], korean: readings[values[2][0]], element: elementMap[values[2][0]] }, engine: 'lunar-javascript@1.7.7', rules: `입춘·절입 시각 경계는 UTC+8 엔진에 한국 표준시를 1시간 빼서 대조. 일주·시주는 입력한 UTC+9 표준시. 자시 학파 ${input.sect}: ${input.sect === 1 ? '23시에 일주 변경' : '0시에 일주 변경'}. 진태양시·음력·역사 시간대·서머타임 자동 환산 미지원. 오행 그래프는 여덟 글자의 단순 개수로 강약 판단이 아님.`, version: RULE_VERSION }; }
export const SIGNS = ['양자리', '황소자리', '쌍둥이자리', '게자리', '사자자리', '처녀자리', '천칭자리', '전갈자리', '사수자리', '염소자리', '물병자리', '물고기자리'];
export function calculateSky(date: string, time: string) { validDateTime(date, time, 1900); const at = new Date(`${date}T${time}:00+09:00`); const bodies = [Astronomy.Body.Sun, Astronomy.Body.Moon, Astronomy.Body.Mercury, Astronomy.Body.Venus, Astronomy.Body.Mars, Astronomy.Body.Jupiter, Astronomy.Body.Saturn]; const names = ['태양', '달', '수성', '금성', '화성', '목성', '토성']; const symbols = ['☉', '☽', '☿', '♀', '♂', '♃', '♄']; const planets = bodies.map((body, i) => { const longitude = Astronomy.Ecliptic(Astronomy.GeoVector(body, at, true)).elon; return { body, name: names[i], symbol: symbols[i], longitude, sign: SIGNS[Math.floor(longitude / 30)], degree: longitude % 30 }; }); return { input: { date, time }, utc: at.toISOString(), planets, engine: 'astronomy-engine@2.1.19', rules: '지구 중심·Tropical·날짜의 참황도(ECT). 한국 표준시 UTC+9 입력. 지리적 장소는 지구 중심 황경에 사용하지 않음. 하우스·상승점 미구현.', version: RULE_VERSION }; }
export function ownsRecord(userId: string, row: {
    userId: string;
}) { return !!userId && row.userId === userId; }
export function canonicalReading(kind: Kind, data: ReadingData): ReadingData { if (!data || typeof data !== 'object')
    throw new Error('결과 데이터 오류'); if (kind === 'tarot') {
    if (!Array.isArray(data.cards) || data.cards.length < 1 || data.cards.length > 10)
        throw new Error('카드 수 오류');
    const ids = new Set<string>();
    const cards = data.cards.map((x: any) => { const card = TAROT.find(c => c.id === x?.card?.id); if (!card || ids.has(card.id) || typeof x.reversed !== 'boolean')
        throw new Error('카드 데이터 오류'); ids.add(card.id); return { card, reversed: x.reversed }; });
    return { cards, question: String(data.question || '').slice(0, 500), spread: String(data.spread || 'custom').slice(0, 40), origin: data.origin === 'daily-cycle' ? 'daily-cycle' : 'user-draw', version: RULE_VERSION };
} if (kind === 'saju')
    return calculateSaju(data.input); if (kind === 'iching')
    return { ...hexagramFromLines(data.lines), question: String(data.question || '').slice(0, 500) }; if (kind === 'astrology')
    return calculateSky(data.input?.date, data.input?.time); throw new Error('지원하지 않는 체계입니다.'); }
export function validateRecord(value: any) { if (!value || !['tarot', 'saju', 'iching', 'astrology'].includes(value.kind) || typeof value.title !== 'string' || !value.title.trim() || value.title.length > 120 || JSON.stringify(value.data || {}).length > 50000)
    throw new Error('기록 형식 또는 크기가 올바르지 않습니다.'); return { kind: value.kind as Kind, title: value.title.trim(), data: canonicalReading(value.kind, value.data) }; }
const positions: Record<string, string[]> = { one: ['지금의 상징'], three: ['지나온 흐름', '현재의 주제', '다음에 생각할 방향'], relationship: ['나의 관점', '관계의 주제', '함께 살필 부분'], choice: ['선택의 배경', '선택 A의 관점', '선택 B의 관점'], celtic: ['현재', '교차하는 주제', '기반', '지나온 흐름', '의식하는 목표', '다음 관점', '나의 태도', '주변 환경', '바람과 염려', '종합 성찰'] };
export function spreadPositions(spread: string, count: number) { return positions[spread] || Array.from({ length: count }, (_, i) => `${i + 1}번째 관점`); }
export function explainReading(kind: Kind, data: ReadingData, mode = 'normal') { const d = canonicalReading(kind, data); let paragraphs: string[] = []; if (kind === 'tarot') {
    const pos = spreadPositions(d.spread, d.cards.length);
    paragraphs = d.cards.map((x: {
        card: TarotCard;
        reversed: boolean;
    }, i: number) => `${pos[i] || `${i + 1}번째 위치`} · ${x.card.name} (${x.reversed ? '역방향' : '정방향'})\n${x.reversed ? x.card.reversed : x.card.upright}`);
    if (mode !== 'simple')
        paragraphs.push(`함께 읽기\n선택된 카드의 주제는 ${[...new Set(d.cards.flatMap((x: any) => x.card.keywords))].join(', ')}입니다. 이 상징 가운데 지금 경험에 맞는 것과 맞지 않는 것을 각각 적어 보세요. 카드가 실제 미래나 타인의 마음을 확인해 주지는 않습니다.`);
} if (kind === 'saju') {
    paragraphs = [`명식\n${d.pillars.map((p: any) => `${p.label} ${p.hanja}(${p.korean})`).join(' · ')}`, `일간의 전통적 상징\n일간 ${d.dayMaster.hanja}(${d.dayMaster.korean})는 ${d.dayMaster.element}에 배속됩니다. 이는 전통적 분류이며 실제 성격이나 능력을 판정한 결과가 아닙니다.`, `오행 개수\n${Object.entries(d.elements).map(([k, v]) => `${k} ${v}개`).join(' · ')}. 천간 네 글자와 지지 네 글자를 하나씩 세었습니다. 계절·지장간·생극을 가중하지 않았으므로 강약이나 용신을 이 수치만으로 판단하지 않습니다.`];
} if (kind === 'iching') {
    paragraphs = [`원괘 · ${d.original.number} ${d.original.name} ${d.original.hanja}\n${d.original.commentary}`, `변화\n${d.moving.length ? `${d.moving.join('·')}번째 효가 변합니다. 변괘는 ${d.changed.number} ${d.changed.name}이며, ${d.changed.theme}라는 관점을 더해 볼 수 있습니다.` : '변효가 없습니다. 이번 결과에서는 원괘의 주제에 머물러 생각해 볼 수 있습니다.'}`, `성찰 질문\n지금 상황에서 유지하고 싶은 것은 무엇인가요? 변화가 필요한 작은 부분은 무엇인가요? 이 문장은 고전 괘사·효사의 번역이 아닌 현대적 편집입니다.`];
} if (kind === 'astrology') {
    paragraphs = [`천문 계산\n${d.planets.map((p: any) => `${p.name} · ${p.sign} ${p.degree.toFixed(2)}°`).join('\n')}`, `해석과 계산의 구분\n천체의 위치는 천문 계산 결과입니다. 별자리 이름은 황경을 30°씩 나눈 Tropical 구간을 가리키며 실제 별자리 경계와 다릅니다. 이 값으로 성격이나 미래 사건이 확정되지는 않습니다.`];
} if (mode === 'simple')
    paragraphs = paragraphs.slice(0, 1); if (mode === 'expert' || mode === 'academic')
    paragraphs.push(`적용 규칙\n${d.rules || (d.origin === 'daily-cycle' ? 'RWS 번호 관례. 날짜에 따라 78장을 순환하는 상징. 정방향으로만 표시하며 무작위 추첨이 아님.' : 'RWS 번호 관례. 정·역방향 1:1 추첨. 중복 없는 추출과 Web Crypto 난수.')}\n버전 ${RULE_VERSION}\n출처: ${kind === 'tarot' ? 'Metropolitan Museum of Art (구조·역사); 상징 해설은 ORACULUM 편집' : kind === 'saju' ? '6tail/lunar-javascript' : kind === 'iching' ? 'Chinese Text Project, 周易 (참고 링크); 해설은 ORACULUM 편집' : 'Don Cross, Astronomy Engine'}`); if (mode === 'academic')
    paragraphs.push('자료를 읽는 관점\n' + ({ tarot: '15세기 카드의 역사와 현대의 점복 해석은 구분해야 합니다. 힘 VIII·정의 XI는 RWS 번호 관례이며 Marseille의 번호와 다릅니다. 이 앱의 한국어 해설은 사료나 역사적 원문이 아닌 현대적 편집입니다. 참고: https://www.metmuseum.org/perspectives/tarot-2', saju: '중국 역법 엔진의 결과를 한국 표준시 입력에 적용한 제한적 구현입니다. 한국 음력과 역사적 시간대, 학파별 용신 해석을 모두 검증한 것은 아닙니다. 오행 단순 개수는 강약의 측정치가 아닙니다. 참고: https://github.com/6tail/lunar-javascript', iching: '64괘의 구조, 동전법의 추첨 규칙, 고전 문헌의 해석은 별개의 층위입니다. 동전법과 시초법은 확률이 다릅니다. 여기서는 고전 효사를 번역하거나 변효의 길흉을 단정하지 않습니다. 참고: https://ctext.org/book-of-changes/yi-jing', astrology: '천문학적 위치 계산의 검증은 점성술적 인과관계의 입증과 다릅니다. Tropical 황도 구간은 현대 천문학의 별자리 경계와 일치하지 않습니다. 장소를 사용하지 않으므로 하우스와 상승점은 이 결과에 없습니다. 참고: https://github.com/cosinekitty/astronomy' }[kind])); return paragraphs.join('\n\n'); }
export function normalizeCustomCount(value: unknown) { const n = Number(value); return Number.isFinite(n) ? Math.max(1, Math.min(10, Math.floor(n))) : 1; }
export function zodiacPoint(longitude: number, radius: number) { const a = (180 - longitude) * Math.PI / 180; return [200 + radius * Math.cos(a), 200 + radius * Math.sin(a)]; }
export function providerSnapshot(kind: Kind, d: ReadingData) { if (kind === 'saju')
    return { pillars: d.pillars, elements: d.elements, dayMaster: d.dayMaster, engine: d.engine, rules: d.rules }; if (kind === 'astrology')
    return { planets: d.planets, engine: d.engine, rules: d.rules }; if (kind === 'iching')
    return { lines: d.lines, original: d.original, changed: d.changed, moving: d.moving, rules: d.rules }; return { cards: d.cards, spread: d.spread, origin: d.origin }; }
