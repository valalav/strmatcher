"use client";

import dynamic from 'next/dynamic';

const STRMatcher = dynamic(() => import('@/components/str-matcher/STRMatcher'), {
  ssr: false
});

export default function Home() {
  return (
    <main className="min-h-screen p-4">
      <STRMatcher />
    </main>
  );
}