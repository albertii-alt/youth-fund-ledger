'use client';

import { useState } from 'react';

interface Props {
  memberName: string;
  contributionDate: string;
  currentAmount: number | null;
  onSave: (amount: number) => Promise<void>;
  onClose: () => void;
}

export default function AmountEditModal({ memberName, contributionDate, currentAmount, onSave, onClose }: Props) {
  const [value, setValue] = useState(currentAmount !== null ? String(currentAmount) : '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(value);
    if (isNaN(parsed) || parsed < 0) { setError('Enter a valid amount (0 or more)'); return; }
    if (parsed > 100000) { setError('Amount seems too large'); return; }
    setLoading(true);
    await onSave(parsed);
    setLoading(false);
  }

  const date = new Date(contributionDate + 'T00:00:00').toLocaleDateString('default', {
    month: 'long', day: 'numeric', year: 'numeric',
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Record Contribution</h2>
        <p className="modal-subtitle">{memberName} — {date}</p>
        <form onSubmit={handleSubmit}>
          <div className="amount-input-wrap">
            <span className="amount-prefix">₱</span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoFocus
              className="pin-input"
            />
          </div>
          {error && <p className="modal-error">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
