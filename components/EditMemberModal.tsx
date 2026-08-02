'use client';

import { useState } from 'react';

interface Member { id: string; name: string; joined_date: string; left_date: string | null }

interface Props {
  member: Member;
  onSave: (id: string, name: string, joined_date: string, left_date: string | null) => Promise<void>;
  onClose: () => void;
}

export default function EditMemberModal({ member, onSave, onClose }: Props) {
  const [name, setName] = useState(member.name);
  const [joinedDate, setJoinedDate] = useState(member.joined_date);
  const [leftDate, setLeftDate] = useState(member.left_date ?? '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required'); return; }
    setLoading(true);
    await onSave(member.id, name.trim(), joinedDate, leftDate || null);
    setLoading(false);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Edit Member</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label>Name</label>
            <input
              type="text"
              maxLength={100}
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
          <div className="form-field">
            <label>Left date <span style={{ fontWeight: 'normal', fontSize: '0.85em' }}>(leave blank if still active)</span></label>
            <input
              type="date"
              value={leftDate}
              onChange={(e) => setLeftDate(e.target.value)}
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
