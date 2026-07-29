'use client';

import { useState } from 'react';

interface Props {
  pinSet: boolean;
  onSuccess: () => void;
  onClose: () => void;
}

export default function PinModal({ pinSet, onSuccess, onClose }: Props) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = pinSet ? '/api/auth/login' : '/api/auth/set-pin';
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      onSuccess();
    } else {
      setError(data.error ?? 'Something went wrong');
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{pinSet ? 'Treasurer Login' : 'Set PIN'}</h2>
        <p className="modal-subtitle">
          {pinSet ? 'Enter your PIN to unlock edit mode.' : 'Choose a PIN to protect the ledger.'}
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            inputMode="numeric"
            placeholder="PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            autoFocus
            className="pin-input"
          />
          {error && <p className="modal-error">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Checking…' : pinSet ? 'Login' : 'Set PIN'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
