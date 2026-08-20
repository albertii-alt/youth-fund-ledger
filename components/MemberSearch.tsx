'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface Result { id: string; name: string }

export default function MemberSearch() {
  const [query, setQuery] = useState('');
  const [members, setMembers] = useState<Result[]>([]);
  const [focused, setFocused] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/members')
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setMembers(d); });
  }, []);

  const q = query.trim().toLowerCase();
  const results: Result[] = q.length < 1 ? [] : (() => {
    const startsWith = members.filter((m) => m.name.toLowerCase().startsWith(q));
    const contains = members.filter((m) => !m.name.toLowerCase().startsWith(q) && m.name.toLowerCase().includes(q));
    return [...startsWith, ...contains].slice(0, 10);
  })();

  const showDropdown = focused && results.length > 0;

  return (
    <div className="member-search" ref={ref}>
      <input
        type="search"
        placeholder="🔍 Find my record…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="member-search-input"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {showDropdown && (
        <ul className="member-search-results">
          {results.map((r) => (
            <li key={r.id}>
              <button
                className="member-search-result-btn"
                onMouseDown={(e) => { e.preventDefault(); setQuery(''); router.push(`/members/${r.id}`); }}
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
