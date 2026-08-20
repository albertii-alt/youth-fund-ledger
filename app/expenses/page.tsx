'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

interface Expense {
  id: string;
  amount: number;
  description: string;
  expense_date: string;
  created_at: string;
}

const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });

const emptyForm = () => ({ amount: '', description: '', expense_date: today() });

export default function ExpensesPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me').then((r) => r.json()).then((d) => setLoggedIn(d.loggedIn));
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/expenses')
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setExpenses(d); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  function openAdd() {
    setForm(emptyForm());
    setFormError('');
    setEditing(null);
    setModal('add');
  }

  function openEdit(e: Expense) {
    setForm({ amount: String(e.amount), description: e.description, expense_date: e.expense_date });
    setFormError('');
    setEditing(e);
    setModal('edit');
  }

  function closeModal() { setModal(null); setEditing(null); setFormError(''); }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setFormError('');
    setSaving(true);
    const url = modal === 'edit' && editing ? `/api/expenses/${editing.id}` : '/api/expenses';
    const method = modal === 'edit' ? 'PATCH' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: Number(form.amount), description: form.description, expense_date: form.expense_date }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setFormError(data.error ?? 'Something went wrong'); return; }
    closeModal();
    load();
  }

  async function handleDelete() {
    if (!confirm) return;
    setDeleting(true);
    await fetch(`/api/expenses/${confirm.id}`, { method: 'DELETE' });
    setDeleting(false);
    setConfirm(null);
    load();
  }

  return (
    <main className="main">
      <div className="al-page-header">
        <Link href="/" className="al-back-link">← Back</Link>
        <h1 className="al-page-title">Expenses</h1>
        {loggedIn && (
          <div className="al-page-controls">
            <button className="btn-primary btn-sm" onClick={openAdd}>+ Add Expense</button>
          </div>
        )}
      </div>

      {loading ? (
        <>
          <div className="skel-card" style={{ height: 52, borderRadius: 8, marginBottom: '1.25rem' }} />
          <ul className="expenses-list">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="expense-entry">
                <div className="skel skel-text" style={{ width: 72 }} />
                <div className="skel skel-text" style={{ flex: 1, minWidth: 80 }} />
                <div className="skel skel-text" style={{ width: 60 }} />
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <div className="expenses-total-bar">
            <span className="expenses-total-label">All-time total</span>
            <span className="expenses-total-value">₱{total.toFixed(2)}</span>
          </div>

          {expenses.length === 0 ? (
            <p className="empty-state">No expenses recorded yet.</p>
          ) : (
            <ul className="expenses-list">
              {expenses.map((e) => (
                <li key={e.id} className="expense-entry">
                  <span className="expense-date">{e.expense_date}</span>
                  <span className="expense-description">{e.description}</span>
                  <span className="expense-amount">₱{Number(e.amount).toFixed(2)}</span>
                  {loggedIn && (
                    <span className="expense-actions">
                      <button className="btn-ghost btn-sm" onClick={() => openEdit(e)}>Edit</button>
                      <button className="btn-danger btn-sm" onClick={() => setConfirm(e)}>Delete</button>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {/* Add / Edit modal */}
      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{modal === 'edit' ? 'Edit Expense' : 'Add Expense'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-field">
                <label>Date</label>
                <input
                  type="date"
                  value={form.expense_date}
                  max={today()}
                  onChange={(e) => setForm((f) => ({ ...f, expense_date: e.target.value }))}
                  className="pin-input"
                  required
                />
              </div>
              <div className="form-field">
                <label>Description</label>
                <input
                  type="text"
                  maxLength={200}
                  placeholder="What was this for?"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  autoFocus
                  className="pin-input"
                  required
                />
              </div>
              <div className="form-field">
                <label>Amount</label>
                <div className="amount-input-wrap">
                  <span className="amount-prefix">₱</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                    className="pin-input"
                    required
                  />
                </div>
              </div>
              {formError && <p className="modal-error">{formError}</p>}
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : modal === 'edit' ? 'Save Changes' : 'Add Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirm && (
        <div className="modal-overlay" onClick={() => setConfirm(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <p className="modal-subtitle">
              Delete &ldquo;{confirm.description}&rdquo; (₱{Number(confirm.amount).toFixed(2)} on {confirm.expense_date})?
              This cannot be undone.
            </p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setConfirm(null)} disabled={deleting}>Cancel</button>
              <button className="btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
