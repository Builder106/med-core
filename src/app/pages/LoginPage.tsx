import { Hexagon } from 'lucide-react';
import { useState, type SubmitEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation } from 'react-router';
import { useApp } from '../context/AppContext';

export function LoginPage() {
  const { t } = useTranslation();
  const { sessionLoading, sessionUser, login } = useApp();
  const location = useLocation();
  const returnTo = (() => {
    const st = location.state as {
      from?: { pathname?: string; search?: string; hash?: string };
    } | null;
    const f = st?.from;
    if (!f?.pathname) return '/';
    return `${f.pathname}${f.search ?? ''}${f.hash ?? ''}`;
  })();

  const [userId, setUserId] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<'invalid' | 'locked' | null>(null);
  const [pending, setPending] = useState(false);

  if (!sessionLoading && sessionUser) {
    return <Navigate to={returnTo} replace />;
  }

  async function onSubmit(e: SubmitEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await login(userId.trim(), pin);
    } catch (err) {
      if (err instanceof Error && err.message === 'locked') setError('locked');
      else setError('invalid');
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-background">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-primary text-sidebar-primary p-2 rounded-xl shadow-sm">
            <Hexagon className="w-6 h-6 fill-current" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">MedCore</h1>
            <p className="text-[12px] text-muted-foreground">{t('auth.subtitle')}</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-5">{t('auth.body')}</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-user" className="block text-[12px] text-muted-foreground mb-1.5">
              {t('auth.userId')}
            </label>
            <input
              id="login-user"
              name="userId"
              autoComplete="username"
              value={userId}
              onChange={e => setUserId(e.target.value)}
              className="af-focus w-full rounded-xl border border-border bg-card px-3 py-2.5 text-[14px] text-foreground"
              placeholder="DOC-001"
              required
            />
          </div>
          <div>
            <label htmlFor="login-pin" className="block text-[12px] text-muted-foreground mb-1.5">
              {t('auth.pin')}
            </label>
            <input
              id="login-pin"
              name="pin"
              type="password"
              autoComplete="current-password"
              value={pin}
              onChange={e => setPin(e.target.value)}
              className="af-focus w-full rounded-xl border border-border bg-card px-3 py-2.5 text-[14px] text-foreground"
              placeholder="••••"
              required
              minLength={4}
            />
          </div>

          {error === 'invalid' && (
            <p className="text-sm text-destructive" role="alert">
              {t('auth.errorInvalid')}
            </p>
          )}
          {error === 'locked' && (
            <p className="text-sm text-destructive" role="alert">
              {t('auth.errorLocked')}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="af-tap af-press af-focus w-full rounded-xl bg-primary px-4 py-3 text-[14px] font-medium text-sidebar-foreground hover:bg-primary-strong disabled:opacity-60"
          >
            {pending ? t('common.loading') : t('auth.submit')}
          </button>
        </form>

        <p className="mt-6 text-[12px] text-muted-foreground leading-relaxed">
          {t('auth.demoHint')}
        </p>
      </div>
    </main>
  );
}
