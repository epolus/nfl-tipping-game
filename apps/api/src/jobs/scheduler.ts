import cron from 'node-cron';
import { syncNflGames } from './syncNflGames';

function isGameDay(): boolean {
  const day = new Date().getUTCDay(); // 0=Sun, 1=Mon, 4=Thu
  return day === 0 || day === 1 || day === 4;
}

function isNflSeasonHours(): boolean {
  const hour = new Date().getUTCHours();
  return hour >= 12 && hour < 24;
}

async function runSync() {
  try {
    const result = await syncNflGames();
    console.log(`[cron] NFL sync complete:`, result);
  } catch (err) {
    console.error('[cron] NFL sync failed:', err);
  }
}

export function startScheduler() {
  // Every 30 minutes on non-game days
  cron.schedule('*/30 * * * *', () => {
    if (!isGameDay()) {
      runSync();
    }
  });

  // Every 2 minutes on Thu/Sun/Mon during NFL season hours
  cron.schedule('*/2 * * * *', () => {
    if (isGameDay() && isNflSeasonHours()) {
      runSync();
    }
  });

  // Initial sync on startup
  setTimeout(runSync, 5000);
  console.log('[cron] NFL sync scheduler started');
}
