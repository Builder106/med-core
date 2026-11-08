import { MessageSquare, Phone, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ClinicalText } from '../components/clinical/ClinicalText';
import { listSmsMessages, simulateInboundSms, type SmsMessage } from '../services/api';

const STATUS_TOKEN: Record<SmsMessage['status'], string> = {
  received: 'bg-muted text-foreground border-border',
  replied: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  failed: 'bg-rose-50 text-red-700 border-rose-200',
  pin_invalid: 'bg-amber-50 text-amber-800 border-amber-200',
  locked: 'bg-red-50 text-red-700 border-red-200',
};

export function SmsInboxPage() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<SmsMessage[]>([]);
  const [mockOutbox, setMockOutbox] = useState<{ to: string; body: string; at: number }[]>([]);
  const [filterType, setFilterType] = useState<string>('');
  const [simFrom, setSimFrom] = useState('+254700000001');
  const [simBody, setSimBody] = useState('PATIENT PAT-001 PIN:4242');
  const [lastReply, setLastReply] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const res = await listSmsMessages({ type: filterType || undefined });
      setMessages(res.messages);
      setMockOutbox(res.mockOutbox);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    const iv = setInterval(refresh, 5000);
    return () => clearInterval(iv);
  }, [filterType]);

  async function onSimulate(e: React.SubmitEvent) {
    e.preventDefault();
    const res = await simulateInboundSms(simFrom, simBody);
    setLastReply(res.reply ?? res.error ?? null);
    refresh();
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-[22px] font-semibold text-foreground flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-primary" />
          {t('sms.inboxTitle')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t('sms.inboxSubtitle')}</p>
      </div>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-[15px] font-semibold text-foreground mb-3 flex items-center gap-2">
          <Send className="w-4 h-4" />
          {t('sms.simulateTitle')}
        </h2>
        <div className="mb-4 rounded-xl border border-sidebar-primary bg-amber-50 px-3 py-2.5 text-[13px] text-foreground space-y-1.5">
          <p>{t('sms.commandHelp')}</p>
          <p className="font-medium">{t('sms.commandPattern')}</p>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() => setSimBody('NOTE PAT-001 PIN:4242 Hi, you are cancer-free.')}
              className="af-press af-focus text-xs px-2.5 py-1.5 rounded-lg border border-border bg-card text-primary"
            >
              {t('sms.fillExampleNote')}
            </button>
            <button
              type="button"
              onClick={() => setSimBody('PATIENT PAT-001 PIN:4242')}
              className="af-press af-focus text-xs px-2.5 py-1.5 rounded-lg border border-border bg-card text-primary"
            >
              {t('sms.fillExamplePatient')}
            </button>
          </div>
        </div>
        <form onSubmit={onSimulate} className="grid md:grid-cols-3 gap-3 items-end">
          <label className="text-xs text-muted-foreground flex flex-col gap-1">
            {t('sms.simulateFrom')}
            <input
              className="af-focus rounded-lg border border-input px-3 py-2 text-sm"
              value={simFrom}
              onChange={e => setSimFrom(e.target.value)}
            />
          </label>
          <label className="text-xs text-muted-foreground flex flex-col gap-1 md:col-span-2">
            {t('sms.simulateBody')}
            <textarea
              className="af-focus notranslate rounded-lg border border-input px-3 py-2 text-sm font-mono min-h-[4.5rem] resize-y max-h-40"
              value={simBody}
              onChange={e => setSimBody(e.target.value)}
              translate="no"
              rows={3}
            />
          </label>
          <button
            className="af-press af-focus md:col-span-3 w-fit bg-primary text-sidebar-foreground px-4 py-2 rounded-lg text-sm"
            type="submit"
          >
            {t('sms.simulateSend')}
          </button>
        </form>
        {lastReply && (
          <div className="mt-3 rounded-lg bg-background border border-border p-3 text-sm text-foreground">
            <span className="text-xs text-muted-foreground mr-2">Reply</span>
            <ClinicalText>{lastReply}</ClinicalText>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-3 gap-3">
          <h2 className="text-[15px] font-semibold text-foreground">{t('sms.inboxTitle')}</h2>
          <select
            aria-label={t('sms.filterType')}
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="af-focus text-xs border border-border rounded-lg px-2 py-1"
          >
            <option value="">{t('sms.filterAll')}</option>
            <option value="PATIENT">PATIENT</option>
            <option value="MEDS">MEDS</option>
            <option value="NOTE">NOTE</option>
            <option value="APPT">APPT</option>
            <option value="EMRG">EMRG</option>
          </select>
        </div>
        {loading && <p className="text-xs text-muted-foreground">{t('common.loading')}</p>}
        {!loading && messages.length === 0 && (
          <p className="text-sm text-muted-foreground">{t('sms.empty')}</p>
        )}
        <ul className="space-y-2">
          {messages.map(m => (
            <li key={m.id} className="rounded-xl border border-border bg-muted p-3">
              <div className="flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
                <span className={`px-2 py-0.5 rounded border ${STATUS_TOKEN[m.status]}`}>
                  {m.status.replace('_', ' ')}
                </span>
                <span>{m.direction}</span>
                {m.command && <span className="text-primary">{m.command}</span>}
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {m.direction === 'inbound' ? m.fromNumber : m.toNumber}
                </span>
                <span>{new Date(m.createdAt).toLocaleString()}</span>
              </div>
              <ClinicalText className="block mt-1 text-sm text-foreground font-mono">
                {m.body}
              </ClinicalText>
              {m.responseSnippet && (
                <p className="mt-1 text-xs text-primary">
                  → <ClinicalText>{m.responseSnippet}</ClinicalText>
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>

      {mockOutbox.length > 0 && (
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-[15px] font-semibold text-foreground mb-3">{t('sms.mockOutbox')}</h2>
          <ul className="space-y-1">
            {mockOutbox.slice(0, 10).map((m, i) => (
              <li key={i} className="text-xs text-muted-foreground">
                <span className="text-primary">{m.to}</span>, <ClinicalText>{m.body}</ClinicalText>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
