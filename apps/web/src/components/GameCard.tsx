import { Game, Tip, isGameLocked, formatKickoff, timeUntilKickoff } from '../lib/api';

interface GameCardProps {
  game: Game;
  tip?: Tip;
  onPick: (gameId: string, teamId: string) => void;
  saving?: boolean;
}

export function GameCard({ game, tip, onPick, saving }: GameCardProps) {
  const locked = isGameLocked(game.kickoff);
  const selectedId = tip?.pickedTeamId;

  const statusBadge = () => {
    switch (game.status) {
      case 'LIVE':
        return <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">LIVE</span>;
      case 'FINAL':
        return <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">FINAL</span>;
      default:
        return (
          <span className="text-xs text-gray-500">
            {locked ? '🔒 Locked' : `⏱ ${timeUntilKickoff(game.kickoff)}`}
          </span>
        );
    }
  };

  const TeamOption = ({ team, isHome }: { team: typeof game.homeTeam; isHome: boolean }) => {
    const isSelected = selectedId === team.id;
    const isWinner = game.status === 'FINAL' && game.winnerTeamId === team.id;
    const score = isHome ? game.homeScore : game.awayScore;

    return (
      <label
        className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
          locked
            ? 'cursor-not-allowed opacity-75'
            : 'hover:border-nfl-navy/40'
        } ${
          isSelected
            ? 'border-nfl-navy bg-nfl-navy/5'
            : 'border-gray-200 bg-white'
        } ${isWinner ? 'ring-2 ring-green-400' : ''}`}
      >
        <input
          type="radio"
          name={`game-${game.id}`}
          value={team.id}
          checked={isSelected}
          disabled={locked || saving}
          onChange={() => onPick(game.id, team.id)}
          className="sr-only"
        />
        {team.logoUrl && (
          <img src={team.logoUrl} alt="" className="w-8 h-8 object-contain" />
        )}
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{team.name}</div>
          <div className="text-xs text-gray-500">{team.nflAbbreviation}</div>
        </div>
        {score != null && (
          <span className="text-lg font-bold tabular-nums">{score}</span>
        )}
        {isSelected && !locked && (
          <span className="text-nfl-navy text-sm">✓</span>
        )}
      </label>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between gap-2 flex-wrap">
        <span className="text-xs text-gray-500">{formatKickoff(game.kickoff)}</span>
        {statusBadge()}
      </div>
      <div className="p-4 space-y-2">
        <TeamOption team={game.awayTeam} isHome={false} />
        <div className="text-center text-xs text-gray-400 font-medium">@</div>
        <TeamOption team={game.homeTeam} isHome={true} />
      </div>
      {tip && game.status === 'FINAL' && (
        <div
          className={`px-4 py-2 text-sm text-center ${
            tip.pickedTeamId === game.winnerTeamId
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {tip.pickedTeamId === game.winnerTeamId ? '✓ Correct (+1 pt)' : '✗ Incorrect'}
        </div>
      )}
    </div>
  );
}
