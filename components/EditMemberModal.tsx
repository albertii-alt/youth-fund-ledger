'use client';

import { useState } from 'react';

interface Member { id: string; name: string; joined_date: string }

interface Props {
  member: Member;
  onSave: (id: string, name: string, joined_date: string) => Promise<void>;
  onClose: () => void;
}

export default function EditMemberModal({ member, onSave, onClose }: Props) {
  const [name, setName] = useState(member.name);
  const [joinedDate, setJoinedDate] = useState(member.joined_date);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required'); return; }
    setLoading(true);
    await onSave(member.id, name.trim(), joinedDate);
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
