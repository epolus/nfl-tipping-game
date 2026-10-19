import { useEffect, useState } from 'react';
import { api, DivisionStanding } from '../lib/api';
import { LoadingSpinner } from '../components/LoadingSpinner';

function DivisionTable({ division }: { division: DivisionStanding }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs dark:bg-gray-900 dark:border-gray-800">
      <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 dark:bg-gray-800/60 dark:border-gray-800">
        <h3 className="font-semibold text-sm text-nfl-navy dark:text-sky-400">{division.name}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b border-gray-100 dark:text-gray-400 dark:border-gray-800">
              <th className="px-3 py-2 font-medium">Team</th>
              <th className="px-2 py-2 font-medium text-center w-8">W</th>
              <th className="px-2 py-2 font-medium text-center w-8">L</th>
              <th className="px-2 py-2 font-medium text-center w-8 hidden sm:table-cell">T</th>
              <th className="px-2 py-2 font-medium text-center w-12">PCT</th>
              <th className="px-2 py-2 font-medium text-center w-12 hidden md:table-cell">DIV</th>
              <th className="px-3 py-2 font-medium text-center w-10 hidden lg:table-cell">STRK</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {division.teams.map((team, idx) => (
              <tr
                key={team.abbreviation}
                className={idx === 0 ? 'bg-green-50/50 dark:bg-green-950/30' : ''}
              >
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {team.logoUrl && (
                      <img src={team.logoUrl} alt="" className="w-5 h-5 object-contain shrink-0" />
                    )}
                    <span className="font-medium truncate">{team.abbreviation}</span>
                  </div>
                </td>
                <td className="px-2 py-2 text-center tabular-nums">{team.wins}</td>
                <td className="px-2 py-2 text-center tabular-nums">{team.losses}</td>
                <td className="px-2 py-2 text-center tabular-nums hidden sm:table-cell">{team.ties}</td>
                <td className="px-2 py-2 text-center tabular-nums text-gray-600 dark:text-gray-400">
                  {team.winPercent}
                </td>
                <td className="px-2 py-2 text-center tabular-nums text-gray-600 hidden md:table-cell dark:text-gray-400">
                  {team.divisionRecord}
                </td>
                <td className="px-3 py-2 text-center text-xs font-medium hidden lg:table-cell">
                  {team.streak}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ConferenceSection({
  conference,
  divisions,
}: {
  conference: 'AFC' | 'NFC';
  divisions: DivisionStanding[];
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold text-nfl-navy dark:text-sky-400">{conference}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {divisions.map((div) => (
          <DivisionTable key={div.name} division={div} />
        ))}
      </div>
    </section>
  );
}

export function StandingsPage() {
  const [season, setSeason] = useState<number | null>(null);
  const [divisions, setDivisions] = useState<DivisionStanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getStandings()
      .then(({ season, divisions }) => {
        setSeason(season);
        setDivisions(divisions);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-red-600 dark:text-red-400">{error}</div>;

  const afc = divisions.filter((d) => d.conference === 'AFC');
  const nfc = divisions.filter((d) => d.conference === 'NFC');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Standings</h1>
        {season != null && (
          <p className="text-gray-500 mt-1 dark:text-gray-400">{season} Regular Season</p>
        )}
      </div>

      {divisions.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">Standings unavailable right now.</p>
      ) : (
        <>
          <ConferenceSection conference="AFC" divisions={afc} />
          <ConferenceSection conference="NFC" divisions={nfc} />
        </>
      )}
    </div>
  );
}
