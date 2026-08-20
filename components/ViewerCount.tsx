'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function ViewerCount() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const key = crypto.randomUUID();

    const channel = supabase.channel('ministryledger-viewers', {
      config: { presence: { key } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        setCount(Object.keys(channel.presenceState()).length);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') await channel.track({});
      });

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Don't render anything until we have a real count — avoids a flash of "0"
  if (count === null) return null;

  return (
    <p className="viewer-count">
      <span className="viewer-dot" />
      {count} {count === 1 ? 'person' : 'people'} viewing now
    </p>
  );
}
