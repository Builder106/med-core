import { Hexagon, Menu, Smartphone, Wifi, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation } from 'react-router';
import { SUPPORTED_LANGUAGES, useApp } from '../context/AppContext';
import { BottomNav } from './BottomNav';
import { MobileDrawer } from './MobileDrawer';
import { Sidebar } from './Sidebar';

export function Layout() {
  const {
    offlineMode,
    role,
    lang,
    setLang,
    lowBandwidth,
    setLowBandwidth,
    setOfflineMode,
    sessionUser,
  } = useApp();
  const { t } = useTranslation();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const routeLabels: Record<string, string> = {
    '/': t('nav.dashboard'),
    '/health-id': t('nav.healthId'),
    '/records': t('nav.myRecords'),
    '/patients': t('nav.patients'),
    '/appointments': t('nav.appointments'),
    '/prescriptions': t('nav.prescriptions'),
    '/lab-results': t('nav.labResults'),
    '/vaccinations': t('nav.vaccinations'),
    '/consent': t('nav.consent'),
    '/ai-assistant': t('nav.aiAssistant'),
    '/referrals': t('nav.referrals'),
    '/audit-log': t('nav.auditLog'),
    '/inventory': t('nav.inventory'),
    '/staff': t('nav.staff'),
    '/reports': t('nav.reports'),
    '/video-consult': t('nav.videoConsult'),
    '/sms-inbox': t('nav.smsInbox'),
    '/reminders': t('reminders.title'),
    '/voice-consult': t('voice.record'),
  };

  const pageLabel = routeLabels[location.pathname] || '';
  const roleLabel =
    role === 'patient'
      ? t('role.patientPortal')
      : role === 'doctor'
        ? t('role.clinicalWorkspace')
        : t('role.facilityAdmin');
  const initials =
    (sessionUser?.name ?? '')
      .replace(/^Dr\.?\s+/i, '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('') || '?';

  return (
    <div className="flex min-h-screen items-stretch bg-background">
      <Sidebar />
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <header
          className="bg-card border-b border-border px-3 sm:px-4 lg:px-7 py-2 sm:py-3 sticky top-0 z-20"
          style={{ paddingTop: 'max(env(safe-area-inset-top), 0.5rem)' }}
        >
          <div className="flex items-center justify-between gap-2 lg:gap-4">
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                aria-label="Open navigation"
                className="af-tap af-focus inline-flex lg:hidden h-11 w-11 items-center justify-center rounded-xl text-foreground hover:bg-accent"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="lg:hidden flex items-center gap-2 min-w-0">
                <div className="bg-primary text-sidebar-primary p-1.5 rounded-lg">
                  <Hexagon className="w-4 h-4 fill-current" />
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-medium text-foreground truncate">
                    {pageLabel || 'MedCore'}
                  </p>
                  <p className="text-[12px] text-muted-foreground truncate">{roleLabel}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setOfflineMode(!offlineMode)}
                aria-pressed={offlineMode}
                className={`af-press af-focus hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12px] border ${offlineMode ? 'bg-amber-50 text-amber-900 border-amber-300' : 'bg-card text-muted-foreground border-border hover:bg-muted'}`}
              >
                {offlineMode ? (
                  <WifiOff className="w-3.5 h-3.5" aria-hidden />
                ) : (
                  <Wifi className="w-3.5 h-3.5" aria-hidden />
                )}
                {offlineMode ? t('common.offlineSync') : t('common.onlineSync')}
              </button>
              <button
                type="button"
                onClick={() => setLowBandwidth(!lowBandwidth)}
                aria-pressed={lowBandwidth}
                className={`af-press af-focus hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12px] border ${lowBandwidth ? 'bg-accent text-foreground border-ring' : 'bg-card text-muted-foreground border-border hover:bg-muted'}`}
              >
                <Smartphone className="w-3.5 h-3.5" aria-hidden />
                {t('common.lowBandwidth')}
              </button>
              <select
                aria-label={t('common.language')}
                value={lang}
                onChange={e => setLang(e.target.value as typeof lang)}
                className="af-focus hidden lg:block bg-card border border-border text-[12px] text-foreground rounded-md px-2 py-1.5"
              >
                {SUPPORTED_LANGUAGES.map(l => (
                  <option key={l.code} value={l.code}>
                    {l.nativeName}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-2 lg:pl-2 lg:ml-1 lg:border-l lg:border-border">
                <span
                  className="hidden lg:inline max-w-[160px] truncate text-[13px] text-foreground"
                  title={sessionUser?.name}
                >
                  {sessionUser?.name}
                </span>
                <div
                  aria-hidden
                  className="w-9 h-9 rounded-full flex items-center justify-center bg-primary text-primary-foreground text-[12px] font-medium"
                >
                  {initials}
                </div>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+5.5rem)] lg:p-6 overflow-y-auto">
          <Outlet />
        </main>
        <BottomNav onOpenMore={() => setDrawerOpen(true)} />
      </div>
    </div>
  );
}
