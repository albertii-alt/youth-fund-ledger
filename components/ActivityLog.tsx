'use client';

import { useEffect, useState, useCallback } from 'react';

interface LogEntry {
  id: number;
  contribution_date: string;
  previous_amount: number;
  new_amount: number;
  changed_at: string;
  members: { name: string } | null;
}

interface Member { id: string; name: string }

interface Props {
  members: Member[];
  loggedIn: boolean;
  onClose: () => void;
}

type Tab = 'visible' | 'hidden';

export default function ActivityLog({ members, loggedIn, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('visible');
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [memberId, setMemberId] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [confirm, setConfirm] = useState<{ label: string; onConfirm: () => Promise<void> } | null>(null);
  const [acting, setActing] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setNextCursor(null);
    const params = new URLSearchParams();
    if (memberId) params.set('member_id', memberId);
    if (tab === 'hidden') params.set('show_hidden', 'true');
    fetch(`/api/activity-log?${params}`)
      .then((r) => r.json())
      .then((d) => { if (d.rows) { setEntries(d.rows); setNextCursor(d.nextCursor); } })
      .finally(() => setLoading(false));
  }, [memberId, tab]);

  async function loadMore() {
    if (!nextCursor) return;
    setLoadingMore(true);
    const params = new URLSearchParams();
    if (memberId) params.set('member_id', memberId);
    if (tab === 'hidden') params.set('show_hidden', 'true');
    params.set('cursor', nextCursor);
    fetch(`/api/activity-log?${params}`)
      .then((r) => r.json())
      .then((d) => { if (d.rows) { setEntries((prev) => [...prev, ...d.rows]); setNextCursor(d.nextCursor); } })
      .finally(() => setLoadingMore(false));
  }

  useEffect(() => { load(); }, [load, reload]);

  function ask(label: string, onConfirm: () => Promise<void>) {
    setConfirm({ label, onConfirm });
  }

  async function runConfirm() {
    if (!confirm) return;
    setActing(true);
    await confirm.onConfirm();
    setActing(false);
    setConfirm(null);
    setReload((n) => n + 1);
  }

  async function hideOne(id: number) {
    await fetch(`/api/activity-log/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'hide' }),
    });
  }

  async function hideAll() {
    await fetch('/api/activity-log/hide-all', { method: 'POST' });
  }

  async function restoreOne(id: number) {
    await fetch(`/api/activity-log/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'restore' }),
    });
  }

  async function deleteOne(id: number) {
    await fetch(`/api/activity-log/${id}`, { method: 'DELETE' });
  }

  async function purgeAll() {
    const body: Record<string, string> = {};
    if (memberId) body.member_id = memberId;
    await fetch('/api/activity-log/purge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  const memberName = memberId ? (members.find((m) => m.id === memberId)?.name ?? '') : '';

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>

          <div className="activity-log-modal-header">
            <h2>Activity Log</h2>
            <div className="activity-log-controls">
              <select value={memberId} onChange={(e) => setMemberId(e.target.value)} className="activity-log-filter">
                <option value="">All members</option>
                {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              {loggedIn && tab === 'visible' && entries.length > 0 && (
                <button className="btn-secondary btn-sm" onClick={() => ask('Hide all visible entries?', hideAll)}>
                  Hide All
                </button>
              )}
              {loggedIn && tab === 'hidden' && entries.length > 0 && (
                <button className="btn-danger btn-sm" onClick={() =>
                  ask(
                    `Permanently delete all hidden entries${memberName ? ` for ${memberName}` : ''}? This cannot be undone.`,
                    purgeAll
                  )
                }>
                  Delete All Hidden
                </button>
              )}
            </div>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>

          {loggedIn && (
            <div className="activity-log-tabs">
              <button
                className={tab === 'visible' ? 'activity-tab activity-tab-active' : 'activity-tab'}
                onClick={() => setTab('visible')}
              >
                Visible
              </button>
              <button
                className={tab === 'hidden' ? 'activity-tab activity-tab-active' : 'activity-tab'}
                onClick={() => setTab('hidden')}
              >
                Hidden
              </button>
            </div>
          )}

          {loading ? (
            <p className="empty-state">Loading…</p>
          ) : entries.length === 0 ? (
            <p className="empty-state">{tab === 'hidden' ? 'No hidden entries.' : 'No activity yet.'}</p>
          ) : (
            <>
              <ul className="activity-log-list">
                {entries.map((e) => (
                  <li key={e.id} className="activity-log-entry">
                    <span className="activity-log-name">{e.members?.name ?? '—'}</span>
                    <span className="activity-log-date">{e.contribution_date}</span>
                    <span className="activity-log-change">
                      ₱{Number(e.previous_amount).toFixed(2)} → ₱{Number(e.new_amount).toFixed(2)}
                    </span>
                    <span className="activity-log-time">
                      {new Date(e.changed_at).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}
                    </span>
                    {loggedIn && tab === 'visible' && (
                      <button
                        className="btn-ghost btn-sm activity-log-hide"
                        onClick={() => ask(
                          `Hide this entry for ${e.members?.name ?? 'member'} on ${e.contribution_date}?`,
                          () => hideOne(e.id)
                        )}
                      >
                        Hide
                      </button>
                    )}
                    {loggedIn && tab === 'hidden' && (
                      <span className="activity-log-actions">
                        <button
                          className="btn-ghost btn-sm"
                          onClick={() => ask(
                            `Restore this entry for ${e.members?.name ?? 'member'} on ${e.contribution_date}?`,
                            () => restoreOne(e.id)
                          )}
                        >
                          Restore
                        </button>
                        <button
                          className="btn-danger btn-sm"
                          onClick={() => ask(
                            `Permanently delete this entry for ${e.members?.name ?? 'member'} on ${e.contribution_date}? This cannot be undone.`,
                            () => deleteOne(e.id)
                          )}
                        >
                          Delete
                        </button>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              {nextCursor && (
                <button className="btn-ghost load-more-btn" onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? 'Loading…' : 'Load more'}
                </button>
              )}
            </>
          )}

        </div>
      </div>

      {confirm && (
        <div className="modal-overlay" onClick={() => setConfirm(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <p className="modal-subtitle">{confirm.label}</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setConfirm(null)} disabled={acting}>Cancel</button>
              <button className="btn-danger" onClick={runConfirm} disabled={acting}>
                {acting ? 'Working…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
