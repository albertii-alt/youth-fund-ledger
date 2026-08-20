'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

interface Props {
  loggedIn: boolean;
  pinSet: boolean;
  onLoginSuccess: () => void;
  onLogout: () => void;
}

export default function HamburgerMenu({ loggedIn, pinSet, onLoginSuccess, onLogout }: Props) {
  const [open, setOpen] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setShowPin(false);
        setPin('');
        setError('');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function handlePinSubmit(e: React.FormEvent) {
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
      setPin('');
      setShowPin(false);
      setOpen(false);
      onLoginSuccess();
    } else {
      setError(data.error ?? 'Something went wrong');
    }
  }

  async function handleLock() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setOpen(false);
    onLogout();
  }

  return (
    <div className="hamburger-wrap" ref={ref}>
      <button
        className="hamburger-btn"
        onClick={() => { setOpen((v) => !v); setShowPin(false); setPin(''); setError(''); }}
        aria-label="Menu"
        aria-expanded={open}
      >
        ☰
      </button>

      {open && (
        <div className="hamburger-dropdown">
          {/* Treasurer section */}
          <div className="hd-section">
            {loggedIn ? (
              <button className="hd-item hd-item--brass" onClick={handleLock}>
                🔒 Lock / Logout
              </button>
            ) : showPin ? (
              <form onSubmit={handlePinSubmit} className="hd-pin-form">
                <p className="hd-pin-label">{pinSet ? 'Enter PIN' : 'Set a PIN'}</p>
                <input
                  type="password"
                  inputMode="numeric"
                  placeholder="PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  autoFocus
                  className="hd-pin-input"
                />
                {error && <p className="hd-pin-error">{error}</p>}
                <div className="hd-pin-actions">
                  <button type="button" className="btn-secondary btn-sm" onClick={() => { setShowPin(false); setPin(''); setError(''); }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary btn-sm" disabled={loading}>
                    {loading ? 'Checking…' : pinSet ? 'Login' : 'Set PIN'}
                  </button>
                </div>
              </form>
            ) : (
              <button className="hd-item" onClick={() => setShowPin(true)}>
                🔑 Treasurer Login
              </button>
            )}
          </div>

          <div className="hd-divider" />

          {/* Public section */}
          <div className="hd-section">
            <Link href="/activity-log" className="hd-item hd-item--link" onClick={() => setOpen(false)}>
              📋 Activity Log
            </Link>
            <Link href="/expenses" className="hd-item hd-item--link" onClick={() => setOpen(false)}>
              💸 Expenses
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
