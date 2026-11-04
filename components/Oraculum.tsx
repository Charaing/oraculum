'use client';
import React, { useEffect, useRef, useState } from 'react';
import { House, Compass, MessageCircle, BookOpen, Bookmark, Settings, ArrowUpRight, ArrowRight, Search, Sparkles, ChevronRight, Globe, PanelLeftClose, X, Info, Download, Trash2, ShieldCheck, LogIn, ExternalLink, Clock, Check, ChevronLeft } from 'lucide-react';
import { Astrolabe, CardArt, HexArt } from './Art';
import { TarotPanel, SajuPanel, IChingPanel, AstrologyPanel, ResultPanel, downloadJson, type Reading } from './ReadingPanels';
import { TAROT, HEXAGRAMS, SOURCES, TRADITIONS, EXPANSION, type TarotCard } from '../lib/catalog';
import { makePendingReading, parsePendingReading } from '../lib/pending';
import type { Kind } from '../lib/engines';
type View = 'home' | 'explore' | 'tarot' | 'saju' | 'iching' | 'astrology' | 'consult' | 'records' | 'settings' | 'guide';
const names: Record<View, string> = { home: '나의 관측소', explore: '세계의 전통', tarot: '타로', saju: '사주팔자', iching: '주역', astrology: '천체 지도', consult: '상징 해설', records: '나의 기록', settings: '내 정보', guide: '이용 안내' };
const nav = [{ id: 'home', name: '나의 관측소', icon: House }, { id: 'explore', name: '세계의 전통', icon: Compass }, { id: 'consult', name: '상징 해설', icon: MessageCircle }, { id: 'records', name: '나의 기록', icon: Bookmark }] as const;
const experiences = [{ id: 'tarot', en: 'TAROT', title: '타로', desc: '78장의 카드, 새로운 관점', symbol: '✧', tag: '나를 돌아보는 질문' }, { id: 'saju', en: 'FOUR PILLARS', title: '사주팔자', desc: '태어난 시간의 여덟 글자', symbol: '甲', tag: '시간에 담긴 상징' }, { id: 'iching', en: 'I CHING', title: '주역', desc: '64괘로 읽는 변화의 흐름', symbol: '☷', tag: '변화를 바라보는 지혜' }, { id: 'astrology', en: 'ASTROLOGY', title: '천체 지도', desc: '그 순간, 하늘의 일곱 천체', symbol: '☉', tag: '천문 계산과 상징' }] as const;
function Modal({ title, children, onClose }: {
    title: string;
    children: React.ReactNode;
    onClose: () => void;
}) { const ref = useRef<HTMLDialogElement>(null); useEffect(() => { ref.current?.showModal(); }, []); return <dialog ref={ref} className="modal" onCancel={onClose} onClick={e => { if (e.target === ref.current)
    onClose(); }}><div className="modal-head"><h2>{title}</h2><button className="icon-button" aria-label="닫기" onClick={onClose}><X size={20}/></button></div><div className="modal-body">{children}</div></dialog>; }
export default function Oraculum({ today, dateLabel }: {
    today: string;
    dateLabel: string;
}) {
    const [view, setView] = useState<View>('home');
    const [reading, setReading] = useState<Reading | null>(null);
    const [readingKey, setReadingKey] = useState('');
    const [records, setRecords] = useState<Reading[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<{
        name: string;
    } | null>(null);
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('traditions');
    const [region, setRegion] = useState('전체');
    const [card, setCard] = useState<TarotCard | null>(null);
    const [hex, setHex] = useState<typeof HEXAGRAMS[number] | null>(null);
    const [tradition, setTradition] = useState<typeof TRADITIONS[number] | null>(null);
    const [sources, setSources] = useState(false);
    const [toast, setToast] = useState('');
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [recordFilter, setRecordFilter] = useState('all');
    const [storageError, setStorageError] = useState('');
    const [reduceMotion, setReduceMotion] = useState(false);
    const [deleteAll, setDeleteAll] = useState(false);
    const [pendingLogin, setPendingLogin] = useState(false);
    const scrolls = useRef<Record<string, number>>({});
    const daily = TAROT[(Math.floor(Date.parse(today + 'T00:00:00Z') / 86400000) + 17) % 78];
    function change(next: View) { scrolls.current[view] = window.scrollY; setView(next); const url = new URL(window.location.href); url.searchParams.set('view', next); history.pushState(null, '', url); requestAnimationFrame(() => window.scrollTo({ top: scrolls.current[next] || 0, behavior: 'instant' })); }
    async function loadRecords() { setLoading(true); try {
        const res = await fetch('/api/readings');
        const body: any = await res.json();
        if (res.status === 401) {
            setRecords([]);
            return;
        }
        if (!res.ok)
            throw new Error(body.error);
        setRecords(body.readings);
        setStorageError('');
    }
    catch (e) {
        setStorageError((e as Error).message);
    }
    finally {
        setLoading(false);
    } }
    useEffect(() => { const value = new URLSearchParams(location.search).get('view') as View; if (value && names[value])
        setView(value); const onPop = () => { const v = new URLSearchParams(location.search).get('view') as View; setView(names[v] ? v : 'home'); }; window.addEventListener('popstate', onPop); fetch('/api/session').then(r => r.json()).then((b: any) => setUser(b.user)).catch(() => { }); loadRecords(); if (new URLSearchParams(location.search).get('restore') === '1') {
        try {
            const raw = sessionStorage.getItem('oraculum-pending');
            if (raw) {
                const draft = parsePendingReading(raw);
                setReading(draft);
                setReadingKey(crypto.randomUUID());
                setView(draft.kind);
                setToast('로그인 전의 결과를 복원했어요. 확인한 뒤 저장해 주세요.');
            }
        }
        catch {
            sessionStorage.removeItem('oraculum-pending');
            setToast('임시 기록이 만료됐어요. 새로운 체험을 시작해 주세요.');
        }
        const clean = new URL(location.href);
        clean.searchParams.delete('restore');
        history.replaceState(null, '', clean);
    } const reduced = localStorage.getItem('oraculum-motion') === 'reduced'; setReduceMotion(reduced); document.documentElement.dataset.motion = reduced ? 'reduced' : 'auto'; return () => window.removeEventListener('popstate', onPop); }, []);
    useEffect(() => { if (toast) {
        const t = setTimeout(() => setToast(''), 5000);
        return () => clearTimeout(t);
    } }, [toast]);
    function result(r: Reading) { setReading(r); setReadingKey(crypto.randomUUID()); window.scrollTo({ top: 0, behavior: 'instant' }); }
    async function save(r: Reading) { try {
        const res = await fetch('/api/readings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: r.kind, title: r.title, data: r.data }) });
        const body: any = await res.json();
        if (res.status === 401) {
            try {
                sessionStorage.setItem('oraculum-pending', makePendingReading(r));
                setPendingLogin(true);
            }
            catch {
                setToast('임시 보관에 실패했어요. 먼저 JSON으로 결과를 내보내 주세요.');
            }
            throw new Error('로그인하면 현재 결과를 이어서 저장할 수 있어요.');
        }
        if (!res.ok)
            throw new Error(body.error);
        setReading(current => current && current.data === r.data ? { ...current, id: body.id } : current);
        sessionStorage.removeItem('oraculum-pending');
        setToast('나의 기록에 안전하게 저장했어요.');
        await loadRecords();
    }
    catch (e) {
        setToast((e as Error).message);
        throw e;
    } }
    function goExperience(id: View) { setReading(null); change(id); }
    const search = (q: unknown) => (String(q).toLowerCase().includes(query.toLowerCase()));
    const filteredTraditions = TRADITIONS.filter(t => (region === '전체' || t.region.includes(region)) && search(t.name + ' ' + t.original + ' ' + t.region));
    const filteredCards = TAROT.filter(c => search(c.name + ' ' + c.english + ' ' + c.keywords.join(' ')));
    const filteredHex = HEXAGRAMS.filter(h => search(h.name + ' ' + h.hanja + ' ' + h.number + ' ' + h.theme));
    const currentIsResult = reading && ['tarot', 'saju', 'iching', 'astrology'].includes(view) && view === reading.kind;
    return <div className="app-shell"><aside className="sidebar no-print"><a href="?view=home" className="brand" onClick={e => { e.preventDefault(); change('home'); }}><span className="brand-mark">✧</span><span>ORACULUM<small>상징의 도서관</small></span></a><div className="sidebar-caption">YOUR OBSERVATORY</div><nav className="main-nav">{nav.map(n => <button key={n.id} className={view === n.id ? 'active' : ''} onClick={() => change(n.id)}><n.icon size={18}/>{n.name}{view === n.id && <span className="nav-dot"/>}</button>)}</nav><div className="sidebar-divider"/><div className="sidebar-caption">EXPLORE THE SYMBOLS</div><nav className="experience-nav">{experiences.map(e => <button key={e.id} className={view === e.id ? 'active' : ''} onClick={() => goExperience(e.id)}><span>{e.symbol}</span>{e.title}<ChevronRight size={14}/></button>)}</nav><div className="sidebar-bottom"><div className="library-note"><span>☽</span><p>오래된 지혜에서<br />오늘의 나를 발견하세요.</p></div><button onClick={() => change('guide')} className={view === 'guide' ? 'active' : ''}><BookOpen size={16}/> 이용 안내 <ArrowUpRight size={13}/></button><button onClick={() => change('settings')} className={view === 'settings' ? 'active' : ''}><Settings size={16}/> 내 정보와 설정</button><div className="sidebar-footer">A SPACE FOR SELF-REFLECTION<br /><span>오라큘럼 · v1.0</span></div></div></aside>
    <div className="main-shell"><header className="topbar no-print"><div className="breadcrumbs"><span className="desktop-only">ORACULUM</span><ChevronRight size={12}/><span>{names[view]}</span></div><div className="topbar-actions"><button className="search-trigger" aria-label="백과사전 검색" onClick={() => { change('explore'); setTimeout(() => document.getElementById('library-search')?.focus(), 50); }}><Search size={17}/><span>상징과 전통 검색</span><kbd>⌕</kbd></button><button className="language" onClick={() => { change('settings'); }}>KO <span>⌄</span></button><button className="avatar" aria-label="내 정보" onClick={() => change('settings')}>{user ? 'O' : <LogIn size={16}/>}</button></div></header><main className="main-content" id="main-content">
        {view === 'home' && <><div className="home-heading"><span className="eyebrow">A LITTLE WONDER, EVERY DAY</span><span className="today-date"><span /> {dateLabel} · KST</span></div><section className="hero"><div className="hero-copy"><div className="hero-kicker"><span>✦</span> 세상의 지혜, 나를 향한 질문</div><h1>오래된 상징 속에서,<br /><em>오늘의 나를 발견하세요.</em></h1><p>타로에서 주역까지, 시간과 문화를 넘어 전해진 이야기.<br className="desktop-only"/> 운명을 단정하는 대신 당신만의 관점을 찾아가는 공간.</p><div className="hero-buttons"><button className="primary" onClick={() => goExperience('tarot')}>나의 첫 타로 시작하기 <ArrowRight size={16}/></button><button className="text-button" onClick={() => change('explore')}>세계의 전통 둘러보기 <ArrowUpRight size={15}/></button></div><div className="hero-foot"><span><Check size={12}/> 계산과 해석의 구분</span><span><Check size={12}/> 확인 가능한 출처</span></div></div><div className="hero-art"><div className="hero-star s1">✦</div><div className="hero-star s2">✧</div><Astrolabe /><span className="art-caption">THE UNIVERSE WITHIN YOU</span><span className="art-note">상징 지도 · 장식</span></div></section>
        <section className="experience-section"><div className="section-line"><div><span className="eyebrow">CHOOSE YOUR PATH</span><h2>오늘, 무엇이 궁금한가요?</h2></div><span className="muted small-text">마음이 향하는 이야기부터 시작해 보세요.</span></div><div className="experience-grid">{experiences.map((e, i) => <button className={`experience-tile tile-${i}`} key={e.id} onClick={() => goExperience(e.id)}><div className="tile-top"><span className="tile-symbol">{e.symbol}</span><ArrowUpRight size={18}/></div><span className="eyebrow">{e.en}</span><h3>{e.title}</h3><p>{e.desc}</p><div className="tile-bottom"><span>{e.tag}</span><ArrowRight size={14}/></div></button>)}</div></section>
        <div className="home-lower-grid"><section className="daily-symbol"><div><span className="eyebrow">A SYMBOL FOR TODAY</span><h2>오늘의 작은 상징</h2><div className="daily-line"/><h3>{daily.name} <span>{daily.english}</span></h3><p>{daily.upright}</p><button className="text-button" onClick={() => { setReading(null); change('tarot'); result({ kind: 'tarot', title: `${today} 오늘의 상징`, data: { cards: [{ card: daily, reversed: false }], spread: 'one', origin: 'daily-cycle', question: '오늘의 성찰' } }); }}>이 상징 깊이 읽기 <ArrowRight size={14}/></button><small className="micro">날짜에 따라 순환하는 상징 · 무작위 추첨과 구분</small></div><div className="daily-card"><CardArt card={daily}/></div></section><section className="quote-panel"><span className="quote-mark">“</span><span className="eyebrow">A MOMENT TO PAUSE</span><h3>답을 서두르기보다,<br />좋은 질문 하나를<br /><em>마음에 놓아 보세요.</em></h3><p>— ORACULUM의 초대</p><div className="quote-stars">· &nbsp; ✧ &nbsp; ·</div></section></div>
        <section className="atlas-section"><div className="section-line"><div><span className="eyebrow">WISDOM WITHOUT BORDERS</span><h2>세계를 잇는 상징의 이야기</h2></div><button className="text-button" onClick={() => change('explore')}>백과사전 둘러보기 <ArrowRight size={14}/></button></div><div className="atlas-grid"><button className="atlas-card east" onClick={() => { setRegion('동아시아'); setCategory('traditions'); change('explore'); }}><div className="atlas-illustration">☰<span>☷</span></div><div><span className="eyebrow">EAST ASIA</span><h3>시간과 변화의 언어</h3><p>사주팔자와 주역의 서로 다른 체계를 탐색합니다.</p><span className="text-link">동아시아의 전통 <ArrowUpRight size={14}/></span></div></button><button className="atlas-card africa" onClick={() => setTradition(TRADITIONS.find(t => t.id === 'ifa')!)}><div className="atlas-illustration ifa-ring">⊙</div><div><span className="eyebrow">YORÙBÁ & DIASPORA</span><h3>전승되는 지혜, 이파</h3><p>공동체의 맥락을 존중하며 공개 자료로 만납니다.</p><span className="text-link">문화 이야기 읽기 <ArrowUpRight size={14}/></span></div></button></div></section>
        <section className="recent-section"><div className="section-line"><div><span className="eyebrow">YOUR PERSONAL JOURNAL</span><h2>다시 펼쳐 보는 나의 기록</h2></div><button className="text-button" onClick={() => change('records')}>전체 기록 <ArrowRight size={14}/></button></div>{records.length ? <div className="recent-list">{records.slice(0, 3).map(r => <button key={r.id} onClick={() => { change(r.kind); result(r); }}><span className="record-symbol">{experiences.find(e => e.id === r.kind)?.symbol}</span><span><b>{r.title}</b><small>{new Date(r.createdAt!).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })} · {names[r.kind]}</small></span><ChevronRight size={16}/></button>)}</div> : <div className="empty-journal"><Bookmark size={20}/><p>당신의 첫 이야기를 기다리고 있어요.<small>체험한 결과를 저장하면 이곳에서 다시 만날 수 있습니다.</small></p><button className="outline" onClick={() => goExperience('tarot')}>첫 기록 만들기 <ArrowRight size={14}/></button></div>}</section></>}
    {(view === 'tarot' || view === 'saju' || view === 'iching' || view === 'astrology') && (currentIsResult ? <><button className="text-button back-link no-print" onClick={() => setReading(null)}><ChevronLeft size={15}/> 새로운 {names[view]} 체험</button><ResultPanel key={readingKey} reading={reading!} onSave={save} onSource={() => setSources(true)}/></> : view === 'tarot' ? <TarotPanel onResult={result}/> : view === 'saju' ? <SajuPanel onResult={result}/> : view === 'iching' ? <IChingPanel onResult={result}/> : <AstrologyPanel onResult={result}/>)}
    {view === 'explore' && <><div className="page-intro"><span className="eyebrow">THE LIBRARY OF SYMBOLS</span><h1>세계를 읽는<br /><em>또 하나의 언어.</em></h1><p>전통의 차이는 지키고, 문화와 상징의 맥락을 연결합니다.</p></div><div className="library-toolbar"><div className="library-search"><Search size={18}/><input id="library-search" aria-label="백과사전 검색" placeholder="전통, 카드, 괘의 이름과 상징 검색" value={query} onChange={e => setQuery(e.target.value)}/>{query && <button className="icon-button" aria-label="검색 지우기" onClick={() => setQuery('')}><X size={16}/></button>}</div><div className="tab-row">{[['traditions', '세계의 전통', 5], ['tarot', '타로 카드', 78], ['iching', '주역 64괘', 64], ['sources', '참고 문헌', 5]].map(([id, label, n]) => <button key={id} className={category === id ? 'active' : ''} onClick={() => setCategory(String(id))}>{label} <small>{n}</small></button>)}</div></div>{category === 'traditions' && <><div className="filter-chips">{['전체', '동아시아', '유럽', '아프리카'].map(r => <button key={r} className={r === region ? 'active' : ''} onClick={() => setRegion(r)}>{r === '전체' ? <Globe size={14}/> : null}{r}</button>)}</div><div className="tradition-grid">{filteredTraditions.map(t => <button className="tradition-card" key={t.id} onClick={() => setTradition(t)}><div className="section-line"><span className="tradition-symbol">{t.symbol}</span><span className="pill">{t.status}</span></div><small>{t.region} · {t.category}</small><h3>{t.name} <span>{t.original}</span></h3><p>{t.intro}</p><span className="text-link">역사와 체계 살펴보기 <ArrowRight size={14}/></span></button>)}</div>{!filteredTraditions.length && <p className="empty-message">검색 결과가 없습니다. 다른 이름으로 찾아보세요.</p>}<div className="expansion-panel"><span className="eyebrow">THE NEXT CHAPTER</span><h3>다음으로 펼쳐 갈 이야기</h3><p>아래 전통은 자료와 권한을 검토한 뒤 추가할 예정입니다. 아직 백과사전이나 계산기로 제공하지 않습니다.</p><div className="expansion-list">{EXPANSION.map(x => <span key={x}>{x}</span>)}</div></div></>}{category === 'tarot' && <><p className="micro">RWS 번호 관례 · 22 메이저 + 56 마이너 · 자체 벡터 아트와 현대적 해설</p><div className="card-library">{filteredCards.map(c => <button key={c.id} onClick={() => setCard(c)}><CardArt card={c}/><h3>{c.name}</h3><small>{c.english}</small></button>)}</div>{!filteredCards.length && <p className="empty-message">검색 결과가 없습니다.</p>}</>}{category === 'iching' && <><p className="micro">문왕괘 순서 · 아래에서 위로 여섯 효 · 해설은 자체 작성한 성찰 안내입니다.</p><div className="hex-library">{filteredHex.map(h => <button key={h.number} onClick={() => setHex(h)}><span>{String(h.number).padStart(2, '0')}</span><HexArt bits={h.bits}/><h3>{h.name}</h3><small>{h.hanja} · {h.theme}</small></button>)}</div>{!filteredHex.length && <p className="empty-message">검색 결과가 없습니다.</p>}</>}{category === 'sources' && <SourceList query={query}/>}</>}
    {view === 'records' && <><div className="page-intro"><span className="eyebrow">YOUR PERSONAL JOURNAL</span><h1>나를 만났던 순간을,<br /><em>다시 펼쳐 보세요.</em></h1><p>저장된 결과와 당시의 규칙 기반 해설은 그대로 보관됩니다.</p></div><div className="section-line records-toolbar"><div className="filter-chips">{[['all', '전체'], ...experiences.map(e => [e.id, e.title])].map(([id, n]) => <button key={id} className={recordFilter === id ? 'active' : ''} onClick={() => setRecordFilter(id)}>{n}</button>)}</div><button className="outline" disabled={!records.length} onClick={() => downloadJson(records, 'oraculum-journal')}><Download size={15}/> 전체 내보내기</button></div>{storageError && <div role="alert" className="note-strip"><p>{storageError}</p><button className="text-button" onClick={loadRecords}>다시 불러오기</button></div>}{loading ? <p className="empty-message">기록을 불러오고 있어요…</p> : records.filter(r => recordFilter === 'all' || r.kind === recordFilter).length ? <div className="record-list">{records.filter(r => recordFilter === 'all' || r.kind === recordFilter).map(r => <article key={r.id}><button className="record-open" onClick={() => { change(r.kind); result(r); }}><span className="record-symbol">{experiences.find(e => e.id === r.kind)?.symbol}</span><div><small>{names[r.kind]} · {new Date(r.createdAt!).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}</small><h3>{r.title}</h3><p>{r.data.question || '계산 결과와 상징 해설'}</p></div><ArrowUpRight size={18}/></button><button className="icon-button" aria-label={`${r.title} 삭제`} onClick={() => setDeleteId(r.id!)}><Trash2 size={16}/></button></article>)}</div> : <div className="empty-state"><Bookmark size={34}/><h2>아직 저장한 이야기가 없어요.</h2><p>{user ? '체험을 마친 뒤 ‘이 기록 저장’을 눌러 보세요.' : '로그인하면 결과를 안전하게 저장하고 다시 볼 수 있어요.'}</p>{!user && <a className="primary" href="/signin-with-chatgpt?return_to=/?view=records" target="_top">ChatGPT로 로그인 <ArrowRight size={15}/></a>}<button className="text-button" onClick={() => goExperience('tarot')}>타로 체험 시작하기 <ArrowRight size={15}/></button></div>}</>}
    {view === 'consult' && <><div className="page-intro"><span className="eyebrow">A CONVERSATION WITH SYMBOLS</span><h1>계산된 결과에서,<br /><em>더 깊은 이야기로.</em></h1><p>선택한 체계의 실제 결과를 바탕으로 상징의 의미를 살펴봅니다.</p></div>{reading ? <ResultPanel key={`consult-${readingKey}`} reading={reading} onSave={save} onSource={() => setSources(true)}/> : <div className="panel consultation-start"><span className="consult-icon"><Sparkles size={30}/></span><h2>먼저 하나의 이야기를 펼쳐 주세요.</h2><p>타로·사주·주역·천체 지도의 결과를 만든 뒤 이곳에서 이어서 해설을 볼 수 있습니다.</p><div className="consult-options">{experiences.map(e => <button className="outline" key={e.id} onClick={() => goExperience(e.id)}><span>{e.symbol}</span>{e.title}<ArrowRight size={14}/></button>)}</div><div className="note-strip"><Info size={17}/><p>AI API가 연결되지 않은 현재 상태에서는 규칙 기반 해설을 제공합니다. 실제 신령과의 소통이나 미래에 대한 확정적 답변을 제공하지 않습니다.</p></div></div>}{!reading && records.length > 0 && <div className="panel"><h3>저장한 기록에서 이어가기</h3>{records.slice(0, 5).map(r => <button key={r.id} className="saved-choice" onClick={() => result(r)}>{r.title}<ArrowRight size={15}/></button>)}</div>}</>}
    {view === 'settings' && <><div className="page-intro"><span className="eyebrow">YOUR OWN SPACE</span><h1>조금 더,<br /><em>나에게 맞게.</em></h1><p>개인정보와 기록, 이용 환경을 직접 관리하세요.</p></div><div className="settings-grid"><section className="panel"><h3><ShieldCheck size={18}/> 내 계정과 기록</h3><p>{user ? `로그인됨 · ${user.name}` : '지금은 로그인하지 않았습니다.'}</p><p className="muted">출생 정보는 계산할 때 브라우저에서 처리합니다. ‘이 기록 저장’을 눌렀을 때만 서버에 보관하며, 로그인한 본인의 기록만 조회할 수 있습니다. 해설 요청 시에는 결과와 질문이 서버로 전송되며, AI 연결 시에는 원 출생 날짜·시간을 제외한 결과가 AI 제공자에게 전달됩니다.</p><div className="settings-row"><span>저장한 기록</span><b>{records.length}개</b></div><div className="settings-row"><span>인증 방식</span><b>ChatGPT 로그인</b></div><div className="button-row">{user ? <a className="outline" target="_top" href="/signout-with-chatgpt?return_to=/">로그아웃</a> : <a className="primary" target="_top" href="/signin-with-chatgpt?return_to=/?view=settings">로그인 <LogIn size={15}/></a>}<button className="outline" disabled={!records.length} onClick={() => downloadJson(records, 'oraculum-all-data')}>기록 내보내기</button></div><button className="text-button danger" disabled={!records.length} onClick={() => setDeleteAll(true)}>내 서버 기록 전체 삭제</button><p className="micro">이 사이트에는 별도의 비밀번호 계정이 없습니다. ChatGPT 계정의 삭제는 ChatGPT 설정에서 관리합니다.</p></section><section className="panel"><h3><Settings size={18}/> 화면과 언어</h3><div className="settings-row"><span>움직임 줄이기<small>카드·천문 장식 애니메이션</small></span><button className={`toggle ${reduceMotion ? 'on' : ''}`} role="switch" aria-checked={reduceMotion} aria-label="움직임 줄이기" onClick={() => { const b = !reduceMotion; setReduceMotion(b); localStorage.setItem('oraculum-motion', b ? 'reduced' : 'auto'); document.documentElement.dataset.motion = b ? 'reduced' : 'auto'; }}><i /></button></div><div className="settings-row"><span>현재 언어</span><b>한국어</b></div><p className="micro">영어·중국어·일본어 인터페이스와 번역 검수 기능은 확장 예정입니다. 원어 용어는 현재도 함께 표기합니다.</p><h3 className="settings-subhead">홈 화면에 추가</h3><p className="muted">모바일 브라우저 메뉴에서 ‘홈 화면에 추가’를 선택하세요. 인터넷 연결이 필요하며 오프라인 모드는 아직 지원하지 않습니다.</p></section></div></>}
    {view === 'guide' && <><div className="page-intro"><span className="eyebrow">READ WITH CONTEXT</span><h1>상징을 만나는<br /><em>우리의 약속.</em></h1><p>무엇을 계산하고, 무엇을 해석하는지 분명하게 알려드립니다.</p></div><div className="guide-grid">{[['01', '체험을 고릅니다', '타로는 카드를, 주역은 여섯 효를 선택합니다. 사주는 양력·한국 표준시를 기준으로 여덟 글자를, 천체 지도는 일곱 천체의 황경을 계산합니다.'], ['02', '결과와 해설을 나눠 읽습니다', '카드·명식·괘·황경은 결과입니다. 그 의미에 관한 문장은 문화적 해설입니다. 기본 해설은 자체 작성한 규칙 기반 문장이며 AI API가 연결될 때만 AI 해설을 제공합니다.'], ['03', '내 기록으로 보관합니다', '저장한 계산 결과는 다시 열 때 재추첨하지 않습니다. 기본 해설과 규칙 버전을 함께 보관합니다. AI로 추가 작성한 해설은 현재 기록에 자동 저장되지 않으며 JSON으로 내보낼 수 있습니다.'], ['04', '전통의 차이를 존중합니다', '사주와 자미두수, 천문학과 점성술, 역사적 룬 문자와 현대 룬 점술은 각각 다른 체계입니다. 제한된 자료로 모든 전통을 구현했다고 주장하지 않습니다.']].map(([n, title, text]) => <section className="panel" key={n}><span className="guide-number">{n}</span><h3>{title}</h3><p>{text}</p></section>)}</div><section className="panel status-panel"><h2>현재 제공 범위</h2><table><thead><tr><th>체험</th><th>사용 가능한 기능</th><th>아직 제공하지 않는 기능</th></tr></thead><tbody><tr><td>타로</td><td>78장·6가지 배열·정/역·기록</td><td>드래그 선택·계통별 전용 해설</td></tr><tr><td>사주</td><td>양력·1962–2099·명식·오행 개수·자시 2규칙</td><td>음력·윤달·해외·역사 시간대·대운·십성</td></tr><tr><td>주역</td><td>64괘·동전법·수동 입력·원괘/변괘</td><td>괘사·효사 전체 원문/번역</td></tr><tr><td>천체 지도</td><td>7천체·Tropical·지구 중심 황경</td><td>하우스·상승점·각도 분석·Sidereal</td></tr><tr><td>해설·자료</td><td>4단계 규칙 해설·출처·문화 항목 5개</td><td>연결된 AI·RAG·대규모 다국어 문헌·관리자</td></tr></tbody></table><p className="micro">1차 배포는 D1 + Drizzle을 사용합니다. PostgreSQL 스키마는 프로젝트에 포함되며 실제 PostgreSQL 연결은 아직 적용되지 않았습니다.</p><button className="text-button" onClick={() => setSources(true)}>참고 문헌과 라이선스 확인 <ExternalLink size={14}/></button></section></>}
    <footer className="site-footer"><div><span className="mini-brand">✧ ORACULUM</span><p>미래를 단정하지 않고, 오늘의 나를 이해하는 시간.</p></div><button className="text-button" onClick={() => setSources(true)}>출처와 계산 규칙 <ArrowUpRight size={13}/></button><span>문화적 해석 · 자기성찰</span></footer></main></div>
    <nav className="mobile-nav no-print">{[...nav, { id: 'settings' as const, name: '내 정보', icon: Settings }].map(n => <button key={n.id} className={view === n.id ? 'active' : ''} onClick={() => change(n.id)}><n.icon size={19}/><span>{n.id === 'home' ? '홈' : n.id === 'explore' ? '탐색' : n.id === 'consult' ? '해설' : n.id === 'records' ? '기록' : n.name}</span></button>)}</nav>
    {toast && <div className="toast" role="status"><Info size={17}/>{toast}<button aria-label="알림 닫기" onClick={() => setToast('')}><X size={14}/></button></div>}
    {pendingLogin && <Modal title="로그인하고 이 기록을 이어서 저장하세요" onClose={() => setPendingLogin(false)}><p>선택한 결과를 이 탭에 최대 30분간 임시 보관합니다. 로그인 후에는 같은 카드를 다시 뽑지 않고 현재 결과를 복원합니다. 탭을 닫거나 시간이 지나면 임시 결과가 없어질 수 있습니다.</p><a className="primary" target="_top" href={`/signin-with-chatgpt?return_to=${encodeURIComponent('/?view=' + (reading?.kind || 'records') + '&restore=1')}`}>ChatGPT로 로그인 <ArrowRight size={15}/></a></Modal>}{sources && <Modal title="출처와 계산 규칙" onClose={() => setSources(false)}><p className="muted">자료마다 확인한 범위가 다릅니다. 외부 문헌의 링크는 해당 기관의 공식 서비스나 제휴를 뜻하지 않습니다.</p><SourceList /><div className="note-strip"><Info size={18}/><p>카드 아트와 한국어 성찰 해설은 자체 제작했습니다. 원전의 번역문을 복제하지 않았습니다. 전문 계산 규칙은 각 결과의 ‘전문 해설’에서 확인하세요.</p></div></Modal>}
    {card && <Modal title={card.name} onClose={() => setCard(null)}><div className="card-detail"><CardArt card={card}/><div><span className="eyebrow">{card.english}</span><div className="filter-chips">{card.keywords.map(k => <span className="pill" key={k}>{k}</span>)}</div><h3>정방향</h3><p>{card.upright}</p><h3>역방향</h3><p>{card.reversed}</p><p className="micro">현대적 성찰 해설 · ORACULUM 편집<br />번호는 RWS 관례, 아트는 자체 제작입니다.</p></div></div></Modal>}
    {hex && <Modal title={`${hex.number}. ${hex.name} ${hex.hanja}`} onClose={() => setHex(null)}><div className="hex-detail"><HexArt bits={hex.bits}/><div><h3>{hex.theme}</h3><p>{hex.commentary}</p><p className="muted">하괘: {hex.lower.name} · {hex.lower.image}<br />상괘: {hex.upper.name} · {hex.upper.image}<br />효는 아래에서 위로 표시합니다.</p></div></div><a className="text-link" href={hex.source} target="_blank" rel="noopener noreferrer">周易 원문 참고 <ExternalLink size={14}/></a><p className="micro">이 앱의 해설은 괘사·효사의 번역이 아닌 현대적 성찰 안내입니다.</p></Modal>}
    {tradition && <Modal title={`${tradition.name} · ${tradition.original}`} onClose={() => setTradition(null)}><div className="tradition-detail-symbol">{tradition.symbol}</div><span className="pill">{tradition.region} · {tradition.category}</span><h3>문화적 맥락</h3><p>{tradition.intro}</p><h3>이 서비스의 범위</h3><p>{tradition.details}</p><div className="source-item"><span className="eyebrow">REFERENCE</span><a href={SOURCES.find(s => s.id === tradition.source)!.url} target="_blank" rel="noopener noreferrer">{SOURCES.find(s => s.id === tradition.source)!.title} <ExternalLink size={14}/></a><p className="micro">{SOURCES.find(s => s.id === tradition.source)!.note}</p></div>{experiences.some(e => e.id === tradition.id) && <button className="primary" onClick={() => { goExperience(tradition.id as View); setTradition(null); }}>직접 체험하기 <ArrowRight size={15}/></button>}</Modal>}
    {(deleteId || deleteAll) && <Modal title={deleteAll ? '서버 기록을 모두 삭제할까요?' : '이 기록을 삭제할까요?'} onClose={() => { setDeleteId(null); setDeleteAll(false); }}><p>삭제한 기록은 복원할 수 없습니다. 필요하면 먼저 JSON 파일로 내보내 주세요.</p><div className="button-row"><button className="outline" onClick={() => { setDeleteId(null); setDeleteAll(false); }}>취소</button><button className="primary danger-bg" disabled={deleting} onClick={async () => { setDeleting(true); try {
        const res = await fetch(deleteAll ? '/api/account' : `/api/readings?id=${encodeURIComponent(deleteId!)}`, { method: 'DELETE' });
        const b: any = await res.json();
        if (!res.ok)
            throw new Error(b.error);
        setDeleteId(null);
        setDeleteAll(false);
        await loadRecords();
        setReading(null);
        setToast('기록을 삭제했어요.');
    }
    catch (e) {
        setToast((e as Error).message);
    }
    finally {
        setDeleting(false);
    } }}>{deleting ? '삭제 중…' : '삭제하기'}</button></div></Modal>}
    </div>;
}
function SourceList({ query = '' }: {
    query?: string;
}) { return <div className="sources-list">{SOURCES.filter(s => (s.title + s.author).toLowerCase().includes(query.toLowerCase())).map((s, i) => <article className="source-item" key={s.id}><span className="eyebrow">{String(i + 1).padStart(2, '0')} · {s.language}</span><a href={s.url} target="_blank" rel="noopener noreferrer">{s.title} <ExternalLink size={14}/></a><small>{s.author}</small><p>{s.note}</p></article>)}</div>; }
