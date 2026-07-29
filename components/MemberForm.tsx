'use client';

import { useState } from 'react';

interface Props {
  onSave: (name: string, joined_date: string) => Promise<void>;
  onClose: () => void;
}

export default function MemberForm({ onSave, onClose }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [name, setName] = useState('');
  const [joinedDate, setJoinedDate] = useState(today);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required'); return; }
    setLoading(true);
    await onSave(name.trim(), joinedDate);
    setLoading(false);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Add Member</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label>Name</label>
            <input
              type="text"
              maxLength={100}
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className="pin-input"
            />
          </div>
          <div className="form-field">
            <label>Joined date</label>
            <input
              type="date"
              value={joinedDate}
              onChange={(e) => setJoinedDate(e.target.value)}
              className="pin-input"
            />
          </div>
          {error && <p className="modal-error">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving…' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
