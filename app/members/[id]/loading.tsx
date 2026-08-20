export default function MemberProfileLoading() {
  return (
    <main className="main">
      {/* Back link */}
      <div className="skel skel-text" style={{ width: 120, marginBottom: '1rem' }} />

      {/* Header */}
      <header className="header" style={{ marginBottom: '1.5rem' }}>
        <div className="skel skel-h1" style={{ width: 220, margin: '0 auto 0.5rem' }} />
        <div className="skel skel-text" style={{ width: 140, margin: '0 auto 0.35rem' }} />
        <div className="skel skel-text" style={{ width: 180, margin: '0 auto' }} />
      </header>

      {/* Stat cards */}
      <div className="mp-stats-bar" style={{ marginBottom: '1.25rem' }}>
        <div className="skel-card" style={{ height: 72, borderRadius: 8 }} />
        <div className="skel-card" style={{ height: 72, borderRadius: 8 }} />
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div className="skel" style={{ width: '100%', height: 10, borderRadius: 999 }} />
        <div className="skel skel-text" style={{ width: 260, margin: '0.4rem auto 0' }} />
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="ledger-table" style={{ tableLayout: 'fixed', width: '100%' }}>
          <thead>
            <tr>
              <th className="col-name">Month</th>
              <th>Contributed</th>
              <th className="col-progress">Status</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 6 }).map((_, i) => (
              <tr key={i}>
                <td className="col-name">
                  <div className="skel skel-text" style={{ width: 64 }} />
                </td>
                <td>
                  <div className="skel skel-text" style={{ width: 56, margin: '0 auto' }} />
                </td>
                <td className="col-progress">
                  <div className="skel skel-text" style={{ width: 80, margin: '0 auto' }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
