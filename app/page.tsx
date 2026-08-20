'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import StatsBar from '@/components/StatsBar';
import YearMonthPicker from '@/components/YearMonthPicker';
import LedgerTable from '@/components/LedgerTable';
import AllTimeTable from '@/components/AllTimeTable';
import AmountEditModal from '@/components/AmountEditModal';
import MemberForm from '@/components/MemberForm';
import EditMemberModal from '@/components/EditMemberModal';
import MemberSearch from '@/components/MemberSearch';
import ViewerCount from '@/components/ViewerCount';
import CollectionProgressBar from '@/components/CollectionProgressBar';
import HamburgerMenu from '@/components/HamburgerMenu';
import Toast from '@/components/Toast';
import { sundaysInMonth, toDateString } from '@/lib/dates';

interface Settings { church_name: string; expected_weekly_amount: number }
interface Member { id: string; name: string; joined_date: string; left_date: string | null }
interface Contribution { member_id: string; contribution_date: string; amount: number }
interface AggRow { member_id: string; year: number; month: number; actual: number; expected: number }
interface MonthData { settings: Settings; members: Member[]; sundays: string[]; contributions: Contribution[]; prevMonthCollected: number | null; membersContributed: number }
interface AllData { settings: Settings; members: Member[]; months: string[]; rows: AggRow[]; prevMonthCollected: null; membersContributed: number }
interface EditTarget { memberId: string; date: string; memberName: string; current: number | null }

export default function Home() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [allTime, setAllTime] = useState(false);
  const [monthData, setMonthData] = useState<MonthData | null>(null);
  const [allData, setAllData] = useState<AllData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [pinSet, setPinSet] = useState(false);
  const [allTimeTotalExpenses, setAllTimeTotalExpenses] = useState(0);
  const monthCache = useRef<Record<string, MonthData>>({});
  const allTimeCache = useRef<AllData | null>(null);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [showRecordNotice, setShowRecordNotice] = useState(false);
  const recordNoticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'neutral' } | null>(null);

  useEffect(() => {
    fetch('/api/auth/me').then((r) => r.json())
      .then((d) => { setLoggedIn(d.loggedIn); setPinSet(d.pinSet); });
    fetch('/api/expenses/total').then((r) => r.json())
      .then((d) => { if (typeof d.total === 'number') setAllTimeTotalExpenses(d.total); });
  }, []);

  const fetchMonth = useCallback(() => {
    const key = `${year}-${month}`;
    if (monthCache.current[key]) {
      setMonthData(monthCache.current[key]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/ledger?year=${year}&month=${month}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.settings && d.members) {
          monthCache.current[key] = d;
          setMonthData(d);
        }
        setLoading(false);
      });
  }, [year, month]);

  const fetchAllTime = useCallback(() => {
    if (allTimeCache.current) {
      setAllData(allTimeCache.current);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch('/api/ledger?all=true')
      .then((r) => r.json())
      .then((d) => {
        if (d.settings && d.members) {
          allTimeCache.current = d;
          setAllData(d);
        }
        setLoading(false);
      });
  }, []);

  useEffect(() => { if (allTime) { setMonthData(null); fetchAllTime(); } }, [allTime, fetchAllTime]);
  useEffect(() => { if (!allTime) fetchMonth(); }, [allTime, fetchMonth]);

  const refresh = () => {
    if (allTime) {
      allTimeCache.current = null;
      fetchAllTime();
    } else {
      delete monthCache.current[`${year}-${month}`];
      fetchMonth();
    }
  };

  const settings = allTime ? allData?.settings : monthData?.settings;
  const members = allTime ? (allData?.members ?? []) : (monthData?.members ?? []);
  const phtToday = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
  const activeMembers = members.filter((m) => m.left_date == null || m.left_date >= phtToday);
  const expectedWeekly = Number(settings?.expected_weekly_amount ?? 20);
  const prevMonthCollected: number | null = (!allTime && monthData?.prevMonthCollected !== undefined)
    ? monthData.prevMonthCollected
    : null;
  const membersContributed: number = (allTime ? allData?.membersContributed : monthData?.membersContributed) ?? 0;

  let collected = 0;
  let expectedCollectibles = 0;

  if (allTime && allData) {
    collected = allData.rows.reduce((sum, r) => sum + r.actual, 0);
    expectedCollectibles = allData.rows.reduce((sum, r) => sum + r.expected, 0);
  } else if (!allTime && monthData) {
    const sundays = monthData.sundays;
    collected = monthData.contributions.reduce((sum, c) => sum + Number(c.amount), 0);
    expectedCollectibles = members.reduce((sum, m) => {
      return sum + sundays.filter(
        (s) => s >= m.joined_date && (m.left_date == null || s <= m.left_date)
      ).length * expectedWeekly;
    }, 0);
  }

  const allTimeCollected = allData ? allData.rows.reduce((sum, r) => sum + r.actual, 0) : 0;
  const availableYears = Array.from(new Set([
    ...(allData?.rows ?? []).map((r) => r.year),
    ...(allData?.members ?? []).map((m) => Number(m.joined_date.slice(0, 4))),
    Number(phtToday.slice(0, 4)),
  ])).sort();

  const isFutureMonth = !allTime &&
    (year > today.getFullYear() || (year === today.getFullYear() && month > today.getMonth() + 1));

  useEffect(() => {
    fetch('/api/ledger?all=true').then((r) => r.json())
      .then((d) => {
        if (d.settings && d.members) {
          allTimeCache.current = d;
          setAllData(d);
        }
      });
  }, []);

  async function handleAddMember(name: string, joined_date: string) {
    await fetch('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, joined_date }),
    });
    setShowMemberForm(false);
    refresh();
  }

  async function handleEditMember(id: string, name: string, joined_date: string, left_date: string | null) {
    await fetch(`/api/members/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, joined_date, left_date }),
    });
    setEditMember(null);
    refresh();
  }

  async function handleMarkAsLeft(member: Member) {
    const date = prompt(`Set left date for "${member.name}":`, new Date().toISOString().slice(0, 10));
    if (!date) return;
    await fetch(`/api/members/${member.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ left_date: date }),
    });
    refresh();
  }

  async function handleReactivate(member: Member) {
    if (!confirm(`Reactivate "${member.name}"? This will clear their left date.`)) return;
    await fetch(`/api/members/${member.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ left_date: null }),
    });
    refresh();
  }

  function openEditModal(memberId: string, date: string, current: number | null) {
    const member = monthData?.members.find((m) => m.id === memberId);
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

  const currentSundays = monthData?.sundays ?? sundaysInMonth(year, month).map(toDateString);

  return (
    <main className="main">
      <header className="header">
        <button className="info-icon-btn" onClick={() => {
            if (recordNoticeTimer.current) clearTimeout(recordNoticeTimer.current);
            setShowRecordNotice((v) => {
              if (!v) recordNoticeTimer.current = setTimeout(() => setShowRecordNotice(false), 3500);
              return !v;
            });
          }} title="About this ledger">
          ℹ️
          {showRecordNotice && (
            <span className="record-notice-popover">Contribution records started June 2026</span>
          )}
        </button>
        <h1>{settings?.church_name ?? 'Youth Ministry'}</h1>
        <p className="subtitle">Contribution Ledger</p>
        <HamburgerMenu
          loggedIn={loggedIn}
          pinSet={pinSet}
          onLoginSuccess={() => { setLoggedIn(true); setPinSet(true); }}
          onLogout={() => setLoggedIn(false)}
          onToast={(message, type) => setToast({ message, type })}
        />
      </header>

      <ViewerCount />

      <MemberSearch />

      <StatsBar
        collected={collected}
        expectedCollectibles={expectedCollectibles}
        memberCount={activeMembers.length}
        prevMonthCollected={prevMonthCollected}
        membersContributed={membersContributed}
        allTime={allTime}
        allTimeTotalExpenses={allTimeTotalExpenses}
        allTimeCollected={allTimeCollected}
      />

      <CollectionProgressBar collected={collected} expected={expectedCollectibles} />

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
        <div className="table-wrapper">
          <div style={{ marginBottom: '1.25rem' }}>
            <div className="skel" style={{ width: '100%', height: 10, borderRadius: 999 }} />
            <div className="skel skel-text" style={{ width: 260, margin: '0.4rem auto 0' }} />
          </div>
          <table className="ledger-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th className="col-name">Member</th>
                {Array.from({ length: 4 }).map((_, i) => <th key={i}>&nbsp;</th>)}
                <th className="col-progress">Progress</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  <td className="col-name"><div className="skel skel-text" style={{ width: 90 }} /></td>
                  {Array.from({ length: 4 }).map((_, j) => (
                    <td key={j}><div className="skel skel-text" style={{ width: 32, margin: '0 auto' }} /></td>
                  ))}
                  <td className="col-progress"><div className="skel skel-text" style={{ width: 80, margin: '0 auto' }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : isFutureMonth ? (
        <p className="empty-state">This month hasn&apos;t happened yet.</p>
      ) : allTime && allData ? (
        <AllTimeTable
          members={allData.members}
          months={allData.months}
          rows={allData.rows}
        />
      ) : monthData ? (
        <LedgerTable
          members={monthData.members}
          sundays={currentSundays}
          contributions={monthData.contributions}
          expectedWeeklyAmount={expectedWeekly}
          loggedIn={loggedIn}
          onEditAmount={openEditModal}
          onMarkAsLeft={handleMarkAsLeft}
          onReactivate={handleReactivate}
          onEditMember={setEditMember}
        />
      ) : (
        <p className="empty-state">Failed to load data.</p>
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

      {toast && (
        <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />
      )}
    </main>
  );
}
