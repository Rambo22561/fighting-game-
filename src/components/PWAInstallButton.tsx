import React, { useState } from 'react';
import { Check, Copy, Download, Smartphone, WifiOff, X } from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [copied, setCopied] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted) {
        setShowGuide(true);
      }
    } else {
      setShowGuide(true);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard restriction
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="pointer-events-auto flex min-h-[44px] items-center gap-2 rounded-xl border border-amber-400/50 bg-[#161b26]/95 px-3.5 py-2 text-xs font-bold tracking-wider text-amber-300 uppercase shadow-lg transition-colors hover:border-amber-400 hover:bg-slate-800 active:scale-95 whitespace-nowrap"
      >
        <Download className="h-4 w-4" />
        <span>Install App</span>
      </button>

      {showGuide && (
        <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-[#0b0e14]/88 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#111622] p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/40 bg-amber-500/15 text-amber-400">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-2xl leading-none font-extrabold tracking-wide text-white uppercase">
                    Install Kensei Arena
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Full-screen offline Android & Mobile App
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Close install guide"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-slate-900 text-slate-300 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs leading-relaxed text-slate-200 sm:text-sm">
              {isIOS ? (
                <div className="rounded-xl border border-white/10 bg-[#0b0e14] p-3.5">
                  <div className="font-bold text-amber-400 uppercase">iPhone / iPad (Safari)</div>
                  <ol className="mt-1.5 list-inside list-decimal space-y-1 text-slate-300">
                    <li>Tap the <strong>Share</strong> icon in Safari&apos;s toolbar.</li>
                    <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
                    <li>Tap <strong>Add</strong> to launch full-screen anytime.</li>
                  </ol>
                </div>
              ) : (
                <div className="rounded-xl border border-white/10 bg-[#0b0e14] p-3.5">
                  <div className="font-bold text-amber-400 uppercase">
                    {isAndroid ? 'Android Phone (Chrome)' : 'Android / Chrome Install'}
                  </div>
                  <ol className="mt-1.5 list-inside list-decimal space-y-1 text-slate-300">
                    <li>Open this app URL directly in <strong>Google Chrome</strong> on Android (outside embedded previews).</li>
                    <li>Tap the <strong>⋮ Menu</strong> in Chrome&apos;s top-right corner.</li>
                    <li>Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li>
                  </ol>
                </div>
              )}

              <div className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2">
                <span className="truncate font-mono-num text-[11px] text-slate-400">
                  {typeof window !== 'undefined' ? window.location.origin : ''}
                </span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex min-h-[34px] shrink-0 items-center gap-1.5 rounded-lg border border-white/15 bg-slate-800 px-2.5 py-1 text-xs font-semibold text-white hover:bg-slate-700"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy Link
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              {isInstallable && (
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await install();
                    if (ok) setShowGuide(false);
                  }}
                  className="flex min-h-[42px] items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-extrabold tracking-wider text-slate-950 uppercase hover:bg-amber-400"
                >
                  <Download className="h-4 w-4" />
                  Install Now
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="flex min-h-[42px] items-center rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-white uppercase hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="pointer-events-none fixed bottom-3 left-3 z-40 flex items-center gap-2 rounded-xl border border-amber-400/50 bg-[#111622]/95 px-3 py-1.5 text-xs font-semibold text-amber-300 shadow-lg">
      <WifiOff className="h-3.5 w-3.5" />
      <span>Offline Mode · Ready to Play</span>
    </div>
  );
};
