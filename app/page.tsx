import Oraculum from '../components/Oraculum';
export const dynamic = 'force-dynamic';
export default function Home() { const now = new Date(); const today = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' }); const dateLabel = now.toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }); return <Oraculum today={today} dateLabel={dateLabel}/>; }
