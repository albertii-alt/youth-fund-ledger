'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface Result { id: string; name: string }

export default function MemberSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length < 1) { setResults([]); setOpen(false); return; }
    const t = setTimeout(() => {
      fetch(`/api/members/search?q=${encodeURIComponent(query)}`)
        .then((r) => r.json())
        .then((d) => { if (Array.isArray(d)) { setResults(d); setOpen(d.length > 0); } });
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="member-search" ref={ref}>
      <input
        type="search"
        placeholder="🔍 Find my record…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="member-search-input"
        onFocus={() => results.length > 0 && setOpen(true)}
      />
      {open && (
        <ul className="member-search-results">
          {results.map((r) => (
            <li key={r.id}>
              <button
                className="member-search-result-btn"
                onClick={() => { setOpen(false); setQuery(''); router.push(`/members/${r.id}`); }}
              >
                {r.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
