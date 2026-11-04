import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'ORACULUM — 상징의 도서관', description: '타로, 사주, 주역과 천체 지도. 오래된 상징 속에서 오늘의 나를 발견하는 시간.', manifest: '/manifest.webmanifest', icons: { icon: '/favicon.svg', apple: '/favicon.svg' } };
export default function RootLayout({ children }: {
    children: React.ReactNode;
}) { return <html lang="ko"><body>{children}</body></html>; }
