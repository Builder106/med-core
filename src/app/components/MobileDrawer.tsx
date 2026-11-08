import { clsx } from 'clsx';
import { Hexagon, LogOut, Smartphone, Wifi, WifiOff, X } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router';
import { SUPPORTED_LANGUAGES, useApp } from '../context/AppContext';
import { adminItems, doctorItems, patientItems } from './Sidebar';

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function MobileDrawer({ open, onClose }: MobileDrawerProps) {
  const {
    role,
    lang,
    setLang,
    offlineMode,
    setOfflineMode,
    lowBandwidth,
    setLowBandwidth,
    sessionUser,
    signOut,
  } = useApp();
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const navItems = role === 'doctor' ? doctorItems : role === 'patient' ? patientItems : adminItems;
  const roleTitle =
    role === 'doctor'
      ? t('sidebar.doctorWorkspace')
      : role === 'patient'
        ? t('sidebar.patientPortal')
        : t('sidebar.facilityAdmin');

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="presentation">
      <button
        type="button"
        aria-label="Close navigation"
        data-testid="mobile-drawer-backdrop"
        onClick={onClose}
        className="absolute inset-0 bg-black/50"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        className="relative z-10 flex h-full w-[86%] max-w-[340px] flex-col bg-sidebar text-sidebar-foreground shadow-2xl on-dark"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-sidebar-primary text-sidebar p-2 rounded-lg">
              <Hexagon className="w-5 h-5 fill-current" aria-hidden />
            </div>
            <div>
              <p className="text-[18px] font-semibold leading-tight text-sidebar-foreground">
                MedCore
              </p>
              <p className="text-[13px] text-sidebar-foreground/75">{roleTitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="af-tap af-focus -mr-1 inline-flex h-11 w-11 items-center justify-center rounded-md text-sidebar-foreground/80 hover:bg-sidebar-strong"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label="Drawer navigation">
          <div className="space-y-1">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  clsx(
                    'af-tap af-focus flex items-center gap-3 rounded-md px-3 py-3 text-[15px] transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-white font-medium'
                      : 'text-sidebar-foreground/80 hover:bg-sidebar-strong hover:text-sidebar-foreground'
                  )
                }
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span>{t(item.labelKey)}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="border-t border-sidebar-border px-5 py-4 space-y-3 text-sidebar-foreground/90">
          <p
            className="text-[13px] font-medium text-sidebar-foreground truncate"
            title={sessionUser?.name}
          >
            {sessionUser?.name}
          </p>

          <label htmlFor="drawer-lang" className="block text-[13px] text-sidebar-foreground/75">
            {t('common.language')}
          </label>
          <select
            id="drawer-lang"
            aria-label={t('common.language')}
            value={lang}
            onChange={e => setLang(e.target.value as typeof lang)}
            className="af-tap af-focus w-full rounded-md border border-sidebar-border bg-sidebar-strong px-3 py-2 text-[14px] text-sidebar-foreground"
          >
            {SUPPORTED_LANGUAGES.map(l => (
              <option key={l.code} value={l.code}>
                {l.nativeName}
              </option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => setLowBandwidth(!lowBandwidth)}
              className={clsx(
                'af-tap af-focus flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-[13px]',
                lowBandwidth
                  ? 'bg-sidebar-accent text-white border-sidebar-primary'
                  : 'bg-sidebar-strong text-sidebar-foreground/80 border-sidebar-border'
              )}
              aria-pressed={lowBandwidth}
            >
              <Smartphone className="w-3.5 h-3.5" />
              {t('common.lowBandwidth')}
            </button>
            <button
              type="button"
              onClick={() => setOfflineMode(!offlineMode)}
              className={clsx(
                'af-tap af-focus flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-[13px]',
                offlineMode
                  ? 'bg-amber-400/20 text-amber-100 border-amber-400/40'
                  : 'bg-sidebar-strong text-sidebar-foreground/80 border-sidebar-border'
              )}
              aria-pressed={offlineMode}
            >
              {offlineMode ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
              {offlineMode ? t('common.offlineSync') : t('common.onlineSync')}
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              void signOut();
            }}
            className="af-tap af-focus mt-2 flex w-full items-center gap-3 rounded-md border border-sidebar-border px-3 py-3 text-[14px] text-sidebar-foreground/90 hover:bg-sidebar-strong"
          >
            <LogOut className="w-4 h-4" />
            {t('auth.signOut')}
          </button>
        </div>
      </aside>
    </div>
  );
}
