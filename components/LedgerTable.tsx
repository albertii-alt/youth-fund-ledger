'use client';

interface Member { id: string; name: string }
interface Sunday { id: string; the_date: string }
interface Contribution { member_id: string; sunday_id: string; amount: number }

interface Props {
  members: Member[];
  sundays: Sunday[];
  contributions: Contribution[];
  expectedWeeklyAmount: number;
}

export default function LedgerTable({ members, sundays, contributions, expectedWeeklyAmount }: Props) {
  const getAmount = (memberId: string, sundayId: string) =>
    contributions.find((c) => c.member_id === memberId && c.sunday_id === sundayId)?.amount ?? null;

  const memberTotal = (memberId: string) =>
    contributions
      .filter((c) => c.member_id === memberId && sundays.some((s) => s.id === c.sunday_id))
      .reduce((sum, c) => sum + Number(c.amount), 0);

  const monthExpected = sundays.length * expectedWeeklyAmount;

  if (members.length === 0) {
    return <p className="empty-state">No members yet.</p>;
  }

  return (
    <div className="table-wrapper">
      <table className="ledger-table">
        <thead>
          <tr>
            <th className="col-name">Member</th>
            {sundays.map((s) => (
              <th key={s.id} className="col-sunday">
                {new Date(s.the_date + 'T00:00:00').toLocaleDateString('default', { month: 'short', day: 'numeric' })}
              </th>
            ))}
            <th className="col-progress">Progress</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => {
            const total = memberTotal(m.id);
            return (
              <tr key={m.id}>
                <td className="col-name">{m.name}</td>
                {sundays.map((s) => {
                  const amount = getAmount(m.id, s.id);
                  return (
                    <td key={s.id} className="col-sunday">
                      {amount !== null && amount > 0 ? (
                        <span className="stamp">₱{Number(amount).toFixed(0)}</span>
                      ) : (
                        <span className="stamp-empty" />
                      )}
                    </td>
                  );
                })}
                <td className="col-progress">
                  ₱{total.toFixed(2)} of ₱{monthExpected.toFixed(2)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
