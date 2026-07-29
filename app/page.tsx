'use client';

import { useEffect, useState, useCallback } from 'react';
import StatsBar from '@/components/StatsBar';
import YearMonthPicker from '@/components/YearMonthPicker';
import LedgerTable from '@/components/LedgerTable';
import PinModal from '@/components/PinModal';
import AmountEditModal from '@/components/AmountEditModal';
import MemberForm from '@/components/MemberForm';
import EditMemberModal from '@/components/EditMemberModal';
import { sundaysInMonth, toDateString } from '@/lib/dates';

interface Settings { church_name: string; expected_weekly_amount: number }
interface Member { id: string; name: string; joined_date: string }
interface Contribution { member_id: string; contribution_date: string; amount: number }
interface LedgerData { settings: Settings; members: Member[]; sundays: string[]; contributions: Contribution[] }
interface EditTarget { memberId: string; date: string; memberName: string; current: number | null }

export default function Home() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [allTime, setAllTime] = useState(false);
  const [data, setData] = useState<LedgerData | null>(null);
  const [allData, setAllData] = useState<{ contributions: Contribution[]; members: Member[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [pinSet, setPinSet] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);

  useEffect(() => {
    fetch('/api/auth/me').then((r) => r.json())
      .then((d) => { setLoggedIn(d.loggedIn); setPinSet(d.pinSet); });
  }, []);

  const fetchLedger = useCallback(() => {
    setLoading(true);
    const url = allTime
      ? '/api/ledger?all=true'
      : `/api/ledger?year=${year}&month=${month}`;
    fetch(url).then((r) => r.json()).then((d) => {
      if (d.settings && d.members && d.sundays && d.contributions) setData(d);
      setLoading(false);
    });
  }, [year, month, allTime]);

  const fetchAllTime = useCallback(() => {
    fetch('/api/ledger?all=true').then((r) => r.json())
      .then((d) => { if (d.contributions && d.members) setAllData(d); });
  }, []);

  useEffect(() => { fetchLedger(); }, [fetchLedger]);
  useEffect(() => { fetchAllTime(); }, [fetchAllTime]);

  const refresh = () => { fetchLedger(); fetchAllTime(); };

  // All-time total
  const grandTotal = (allData?.contributions ?? []).reduce((sum, c) => sum + Number(c.amount), 0);

  // Current month stats using joined_date-aware formula
  const currentMonthSundays = sundaysInMonth(today.getFullYear(), today.getMonth() + 1).map(toDateString);
  const currentMembers = allData?.members ?? [];
  const monthCollected = (allData?.contributions ?? [])
    .filter((c) => currentMonthSundays.includes(c.contribution_date))
    .reduce((sum, c) => sum + Number(c.amount), 0);
  const monthExpected = currentMembers.reduce((sum, m) => {
    return sum + currentMonthSundays.filter((s) => s >= m.joined_date).length * (data?.settings?.expected_weekly_amount ?? 20);
  }, 0);

  // Years available for picker
  const availableYears = Array.from(new Set([
    ...(allData?.contributions ?? []).map((c) => c.contribution_date.slice(0, 4)),
    ...(allData?.members ?? []).map((m) => m.joined_date.slice(0, 4)),
    String(today.getFullYear()),
  ])).map(Number).sort();

  // Future month check
  const isFutureMonth = !allTime &&
    (year > today.getFullYear() || (year === today.getFullYear() && month > today.getMonth() + 1));

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setLoggedIn(false);
  }

  async function handleAddMember(name: string, joined_date: string) {
    await fetch('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, joined_date }),
    });
    setShowMemberForm(false);
    refresh();
  }

  async function handleEditMember(id: string, name: string, joined_date: string) {
    await fetch(`/api/members/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, joined_date }),
    });
    setEditMember(null);
    refresh();
  }

  async function handleRemoveMember(id: string, name: string) {
    if (!confirm(`Remove "${name}" and all their contributions?`)) return;
    await fetch(`/api/members/${id}`, { method: 'DELETE' });
    refresh();
  }

  function openEditModal(memberId: string, date: string, current: number | null) {
    const member = data?.members.find((m) => m.id === memberId);
    if (!member) return;
    setEditTarget({ memberId, date, memberName: member.name, current });
  }

  async function handleSaveAmount(amount: number) {
    if (!editTarget) return;
    await fetch('/api/contributions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ member_id: editTarget.memberId, contribution_date: editTarget.date, amount }),
    });
    setEditTarget(null);
    refresh();
  }

  return (
    <main className="main">
      <header className="header">
        <h1>{data?.settings?.church_name ?? 'Youth Ministry'}</h1>
        <p className="subtitle">Contribution Ledger</p>
        <div className="auth-bar">
          {loggedIn
            ? <button className="btn-secondary" onClick={handleLogout}>🔒 Lock</button>
            : <button className="btn-primary" onClick={() => setShowPinModal(true)}>Treasurer Login</button>
          }
        </div>
      </header>

      <StatsBar
        allTimeTotal={grandTotal}
        memberCount={currentMembers.length}
        monthCollected={monthCollected}
        monthExpected={monthExpected}
      />

      {loggedIn && (
        <div className="admin-bar">
          <button className="btn-primary" onClick={() => setShowMemberForm(true)}>+ Add Member</button>
        </div>
      )}

      <YearMonthPicker
        year={year}
        month={month}
        allTime={allTime}
        years={availableYears}
        onChange={(y, m) => { setYear(y); setMonth(m); setAllTime(false); }}
        onAllTime={() => setAllTime(true)}
      />

      {loading ? (
        <p className="empty-state">Loading…</p>
      ) : isFutureMonth ? (
        <p className="empty-state">This month hasn't happened yet.</p>
      ) : data ? (
        <LedgerTable
          members={data.members}
          sundays={data.sundays}
          contributions={data.contributions}
          expectedWeeklyAmount={data.settings?.expected_weekly_amount ?? 20}
          loggedIn={loggedIn}
          onEditAmount={openEditModal}
          onRemoveMember={handleRemoveMember}
          onEditMember={setEditMember}
        />
      ) : (
        <p className="empty-state">Failed to load data.</p>
      )}

      {showPinModal && (
        <PinModal
          pinSet={pinSet}
          onSuccess={() => { setLoggedIn(true); setPinSet(true); setShowPinModal(false); }}
          onClose={() => setShowPinModal(false)}
        />
      )}
      {showMemberForm && (
        <MemberForm onSave={handleAddMember} onClose={() => setShowMemberForm(false)} />
      )}
      {editMember && (
        <EditMemberModal
          member={editMember}
          onSave={handleEditMember}
          onClose={() => setEditMember(null)}
        />
      )}
      {editTarget && (
        <AmountEditModal
          memberName={editTarget.memberName}
          contributionDate={editTarget.date}
          currentAmount={editTarget.current}
          onSave={handleSaveAmount}
          onClose={() => setEditTarget(null)}
        />
      )}
    </main>
  );
}
