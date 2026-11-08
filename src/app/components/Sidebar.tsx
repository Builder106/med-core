import { clsx } from 'clsx';
import {
  Activity,
  Barcode,
  Bell,
  Bot,
  CalendarCheck2,
  FileText,
  HeartPulse,
  Hexagon,
  KeyRound,
  LogOut,
  MessageSquare,
  Mic,
  Pill,
  Shield,
  Stethoscope,
  Syringe,
  TestTube2,
  UserCog,
  Users,
  Video,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router';
import { useApp } from '../context/AppContext';

export type NavItem = {
  to: string;
  labelKey: string;
  icon: ComponentType<{ className?: string }>;
};

export const doctorItems: NavItem[] = [
  { to: '/', labelKey: 'sidebar.clinicalHub', icon: Stethoscope },
  { to: '/patients', labelKey: 'sidebar.patientSearch', icon: Users },
  { to: '/appointments', labelKey: 'sidebar.queueAppointments', icon: CalendarCheck2 },
  { to: '/records', labelKey: 'sidebar.unifiedTimeline', icon: Activity },
  { to: '/prescriptions', labelKey: 'sidebar.prescriptionWriter', icon: Pill },
  { to: '/reminders', labelKey: 'reminders.title', icon: Bell },
  { to: '/lab-results', labelKey: 'sidebar.labSignals', icon: TestTube2 },
  { to: '/referrals', labelKey: 'nav.referrals', icon: HeartPulse },
  { to: '/video-consult', labelKey: 'sidebar.videoConsult', icon: Video },
  { to: '/voice-consult', labelKey: 'voice.record', icon: Mic },
  { to: '/sms-inbox', labelKey: 'sidebar.smsInbox', icon: MessageSquare },
  { to: '/ai-assistant', labelKey: 'sidebar.aiClinicalAssistant', icon: Bot },
];

export const patientItems: NavItem[] = [
  { to: '/', labelKey: 'sidebar.myHealthHub', icon: HeartPulse },
  { to: '/health-id', labelKey: 'sidebar.scannableHealthId', icon: Barcode },
  { to: '/records', labelKey: 'sidebar.medicalHistory', icon: FileText },
  { to: '/prescriptions', labelKey: 'nav.prescriptions', icon: Pill },
  { to: '/reminders', labelKey: 'reminders.title', icon: Bell },
  { to: '/appointments', labelKey: 'nav.appointments', icon: CalendarCheck2 },
  { to: '/video-consult', labelKey: 'sidebar.videoConsult', icon: Video },
  { to: '/vaccinations', labelKey: 'nav.vaccinations', icon: Syringe },
  { to: '/consent', labelKey: 'nav.consent', icon: KeyRound },
  { to: '/audit-log', labelKey: 'sidebar.recordAccessLog', icon: Shield },
];

export const adminItems: NavItem[] = [
  { to: '/', labelKey: 'sidebar.facilityCommand', icon: UserCog },
  { to: '/staff', labelKey: 'sidebar.staffManagement', icon: Users },
  { to: '/inventory', labelKey: 'sidebar.drugInventory', icon: Pill },
  { to: '/reports', labelKey: 'sidebar.ministryReports', icon: FileText },
  { to: '/sms-inbox', labelKey: 'sidebar.smsInbox', icon: MessageSquare },
  { to: '/audit-log', labelKey: 'sidebar.securityAudit', icon: Shield },
  { to: '/lab-results', labelKey: 'sidebar.labIntegrations', icon: TestTube2 },
];

export function Sidebar() {
  const { role, signOut } = useApp();
  const { t } = useTranslation();
  const roleTitle =
    role === 'doctor'
      ? t('sidebar.doctorWorkspace')
      : role === 'patient'
        ? t('sidebar.patientPortal')
        : t('sidebar.facilityAdmin');
  const navItems = role === 'doctor' ? doctorItems : role === 'patient' ? patientItems : adminItems;

  return (
    <aside className="on-dark w-64 bg-sidebar text-sidebar-foreground hidden lg:flex flex-col min-h-screen self-stretch z-20 flex-shrink-0 border-r border-sidebar-border">
      <div className="flex items-center gap-3 px-5 pt-5 pb-5">
        <div className="bg-sidebar-primary text-sidebar p-2 rounded-lg">
          <Hexagon className="w-5 h-5 fill-current" aria-hidden />
        </div>
        <div>
          <p className="text-[18px] font-semibold leading-tight text-sidebar-foreground">MedCore</p>
          <p className="text-[13px] text-sidebar-foreground/75">{roleTitle}</p>
        </div>
      </div>
      <nav
        aria-label={t('sidebar.navigation', { defaultValue: 'Main' })}
        className="flex-1 px-3 pb-6 overflow-y-auto"
      >
        <div className="space-y-0.5">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                clsx(
                  'af-focus w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-[14px]',
                  isActive
                    ? 'bg-sidebar-accent text-white font-medium'
                    : 'text-sidebar-foreground/80 hover:bg-sidebar-strong hover:text-sidebar-foreground'
                )
              }
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{t(item.labelKey)}</span>
            </NavLink>
          ))}
        </div>
      </nav>
      <div className="p-3 border-t border-sidebar-border">
        <button
          type="button"
          onClick={() => void signOut()}
          className="af-focus w-full flex items-center gap-3 px-3 py-2.5 text-[14px] text-sidebar-foreground/80 hover:bg-sidebar-strong hover:text-sidebar-foreground rounded-md transition-colors"
        >
          <LogOut className="w-4 h-4" aria-hidden />
          {t('sidebar.signOut')}
        </button>
      </div>
    </aside>
  );
}
