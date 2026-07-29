'use client';

import { useEffect, useState } from 'react';
import StatsBar from '@/components/StatsBar';
import MonthSelect from '@/components/MonthSelect';
import LedgerTable from '@/components/LedgerTable';
import PinModal from '@/components/PinModal';

interface Settings { church_name: string; expected_weekly_amount: number }
interface Member { id: string; name: string }
interface Sunday { id: string; the_date: string }
interface Contribution { member_id: string; sunday_id: string; amount: number }

interface LedgerData {
  settings: Settings;
  members: Member[];
  sundays: Sunday[];
  allSundays: Sunday[];
  contributions: Contribution[];
}

export default function Home() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState(currentMonth);
  const [data, setData] = useState<LedgerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [allData, setAllData] = useState<{ contributions: Contribution[] } | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [pinSet, setPinSet] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => { setLoggedIn(d.loggedIn); setPinSet(d.pinSet); });
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/ledger?month=${month}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.settings && d.members && d.sundays && d.contributions) {
          setData(d);
        }
        setLoading(false);
      });
  }, [month]);

  useEffect(() => {
    fetch('/api/ledger?month=all')
      .then((r) => r.json())
      .then((d) => { if (d.contributions) setAllData(d); });
  }, []);

  const grandTotal = (allData?.contributions ?? []).reduce((sum, c) => sum + Number(c.amount), 0);
  const monthCollected = (data?.contributions ?? []).reduce((sum, c) => sum + Number(c.amount), 0);
  const monthExpected = (data?.sundays ?? []).length * (data?.settings?.expected_weekly_amount ?? 20);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setLoggedIn(false);
  }

  return (
    <main className="main">
      <header className="header">
        <h1>{data?.settings?.church_name ?? 'Youth Ministry'}</h1>
        <p className="subtitle">Contribution Ledger</p>
        <div className="auth-bar">
          {loggedIn ? (
            <button className="btn-secondary" onClick={handleLogout}>🔒 Lock</button>
          ) : (
            <button className="btn-primary" onClick={() => setShowModal(true)}>Treasurer Login</button>
          )}
        </div>
      </header>

      {data && (
        <StatsBar
          allTimeTotal={grandTotal}
          memberCount={(data.members ?? []).length}
          monthCollected={monthCollected}
          monthExpected={monthExpected}
        />
      )}

      <div className="controls">
        {data && (
          <MonthSelect
            allSundays={data.allSundays ?? []}
            value={month}
            onChange={setMonth}
          />
        )}
      </div>

      {loading ? (
        <p className="empty-state">Loading…</p>
      ) : data ? (
        <LedgerTable
          members={data.members ?? []}
          sundays={data.sundays ?? []}
          contributions={data.contributions ?? []}
          expectedWeeklyAmount={data.settings?.expected_weekly_amount ?? 20}
        />
      ) : (
        <p className="empty-state">Failed to load data.</p>
      )}

      {showModal && (
        <PinModal
          pinSet={pinSet}
          onSuccess={() => { setLoggedIn(true); setPinSet(true); setShowModal(false); }}
          onClose={() => setShowModal(false)}
        />
      )}
    </main>
  );
}
