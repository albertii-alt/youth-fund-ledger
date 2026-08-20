'use client';

import { useEffect, useState } from 'react';

interface Props {
  message: string;
  type: 'success' | 'neutral';
  onDone: () => void;
}

export default function Toast({ message, type, onDone }: Props) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const hide = setTimeout(() => setVisible(false), 2200);
    const done = setTimeout(onDone, 2700);
    return () => { clearTimeout(hide); clearTimeout(done); };
  }, [onDone]);

  return (
    <div className={`toast toast--${type} ${visible ? 'toast--in' : 'toast--out'}`}>
      {message}
    </div>
  );
}
