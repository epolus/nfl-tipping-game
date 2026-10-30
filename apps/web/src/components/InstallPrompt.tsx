import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'nfl-tipping-install-dismissed';

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY) === '1') return;
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  if (!visible || !deferred) return null;

  const install = async () => {
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setVisible(false);
  };

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  };

  return (
    <div className="fixed bottom-4 inset-x-4 z-50 mx-auto max-w-md rounded-xl bg-nfl-navy text-white shadow-lg p-4 flex items-start gap-3 dark:bg-sky-900">
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">Install NFL Tips</p>
        <p className="text-xs text-white/80 mt-0.5">
          Add it to your home screen for quick access.
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={dismiss}
          className="text-xs text-white/70 hover:text-white px-2 py-1.5"
        >
          Not now
        </button>
        <button
          type="button"
          onClick={install}
          className="text-xs font-semibold bg-white text-nfl-navy rounded-lg px-3 py-1.5 hover:bg-white/90 dark:text-sky-900"
        >
          Install
        </button>
      </div>
    </div>
  );
}
