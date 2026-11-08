import { Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { patients } from '../data/mock-data';
import { aiChatStream } from '../services/api';

interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: Date;
}

// Sample answers shown only when the API cannot be reached (static demo builds).
const sampleResponses: Record<string, string> = {
  summary: `## Patient Summary — Amina Okafor (PAT-001)

**Demographics:** Female, 38 years old, Blood Type O+, NHIF Kenya
**Known Allergies:** ⚠️ Penicillin

### Active Conditions
- **Type 2 Diabetes Mellitus** — Diagnosed 2026-04-10, fasting glucose 11.2 mmol/L
- **Hypertension** — Controlled on Amlodipine 5mg, latest BP 130/82

### Current Medications
1. Metformin 500mg BD (started 2026-04-10)
2. Amlodipine 5mg OD (ongoing)

### Recent Lab Results
- **Fasting Glucose:** 11.2 mmol/L ⚠️ (significantly elevated)
- **HbA1c:** 7.8% ⚠️ (above target <7%)
- **CBC:** Normal

### ⚠️ High-Risk Flags
1. **Newly diagnosed diabetes with poor glycaemic control** — HbA1c 7.8% suggests chronic hyperglycaemia predating diagnosis
2. **Weight trend:** 78-80 kg over 3 months — monitor for metabolic syndrome
3. **Dual cardiovascular risk:** Hypertension + diabetes significantly elevates CVD risk

### Overdue Screenings
- **Diabetic retinopathy screening** — Should be performed at diagnosis
- **Foot examination** — Baseline assessment recommended
- **Renal function panel** — eGFR and urine albumin-creatinine ratio needed`,

  differential: `## Differential Diagnosis Analysis

Based on presenting symptoms of polyuria, polydipsia, and elevated fasting glucose (11.2 mmol/L):

### Most Likely
1. **Type 2 Diabetes Mellitus** (95% probability)
   - Age 38, BMI likely elevated, HbA1c 7.8%
   - Classic osmotic symptoms present

### Consider
2. **Type 1 Diabetes / LADA** (3% probability)
   - Less likely given age, but GAD antibodies should be checked if poor response to metformin
3. **Secondary Diabetes** (2% probability)
   - Cushing's, acromegaly — no clinical features described

### Recommended Next Steps
- Confirm with repeat fasting glucose or OGTT
- Check C-peptide and GAD antibodies
- Comprehensive metabolic panel
- Lipid profile for cardiovascular risk stratification`,

  interactions: `## Drug Interaction Check

### Current Medications Review

**Metformin 500mg + Amlodipine 5mg**
- ✅ No significant drug-drug interactions
- ℹ️ Both drugs are metabolised differently (renal vs hepatic)

### Warnings
- ⚠️ **Patient is allergic to Penicillin** — avoid all penicillin-class antibiotics
- ⚠️ **Amlodipine + Grapefruit** — advise patient to avoid grapefruit juice
- ⚠️ **Metformin + Contrast dye** — hold metformin 48h before/after CT with contrast
- ⚠️ **Metformin + Alcohol** — increased risk of lactic acidosis

### Monitoring Required
- Renal function every 3-6 months (metformin)
- Blood pressure weekly initially (amlodipine titration)
- HbA1c every 3 months until at target`,
};

const quickActions = [
  { label: 'Summarise patient record', key: 'summary' },
  { label: 'Differential diagnosis', key: 'differential' },
  { label: 'Drug interaction check', key: 'interactions' },
];

type Source = 'model' | 'server-sample' | 'offline-sample';

function escapeHtml(text: string) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderMarkdown(text: string) {
  return escapeHtml(text)
    .replace(/^## (.*)$/gm, '<h3 class="text-[15px] font-semibold mt-3 mb-1">$1</h3>')
    .replace(/^### (.*)$/gm, '<h4 class="text-[14px] font-semibold mt-2 mb-1">$1</h4>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

export function AiAssistantPage() {
  const { currentPatientId } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [source, setSource] = useState<Source | null>(null);
  const [selectedPatient, setSelectedPatient] = useState(currentPatientId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const ask = async (question: string, sampleKey: string) => {
    if (isStreaming) return;
    const history = [
      ...messages,
      { id: `u-${Date.now()}`, role: 'user' as const, content: question, timestamp: new Date() },
    ];
    const replyId = `ai-${Date.now()}`;
    setMessages([
      ...history,
      { id: replyId, role: 'assistant', content: '', timestamp: new Date() },
    ]);
    setIsStreaming(true);
    const append = (text: string) =>
      setMessages(prev =>
        prev.map(m => (m.id === replyId ? { ...m, content: m.content + text } : m))
      );
    try {
      const { provider } = await aiChatStream(
        {
          patientId: selectedPatient,
          messages: history.map(m => ({ role: m.role, content: m.content })),
        },
        append
      );
      setSource(provider === 'openrouter' ? 'model' : 'server-sample');
    } catch {
      append(sampleResponses[sampleKey] ?? sampleResponses.summary);
      setSource('offline-sample');
    } finally {
      setIsStreaming(false);
    }
  };

  const handleSend = () => {
    const question = input.trim();
    if (!question) return;
    setInput('');
    void ask(question, 'summary');
  };

  return (
    <div className="max-w-4xl h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-3">
        <div>
          <h1 className="text-[22px] font-semibold text-foreground">AI clinical assistant</h1>
          <p className="text-[13px] text-muted-foreground">
            Answers are advisory. Check them against the chart and your own judgement, and do not
            pass them to patients directly.
          </p>
        </div>
        <label className="text-[13px] text-muted-foreground">
          <span className="block mb-1">Patient</span>
          <select
            value={selectedPatient}
            onChange={e => {
              setSelectedPatient(e.target.value);
              setMessages([]);
              setSource(null);
            }}
            className="af-focus text-[13px] border border-border rounded-md px-3 py-2 bg-card text-foreground"
          >
            {patients.map(p => (
              <option key={p.id} value={p.id}>
                {p.firstName} {p.lastName} ({p.id})
              </option>
            ))}
          </select>
        </label>
      </div>

      {source && source !== 'model' && (
        <p
          role="status"
          className="mb-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-[13px] text-amber-950"
        >
          {source === 'offline-sample'
            ? 'The server is unreachable. This is a stored sample answer for Amina Okafor (PAT-001).'
            : 'No AI model is configured on the server, so this is a sample answer.'}
        </p>
      )}

      <div className="flex-1 overflow-y-auto bg-card rounded-lg border border-border p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-[14px] text-foreground mb-1">
              Ask about the selected patient&apos;s chart.
            </p>
            <p className="text-[13px] text-muted-foreground mb-5 max-w-sm">
              The assistant reads the record, lab results and prescriptions on file.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {quickActions.map(a => (
                <button
                  type="button"
                  key={a.key}
                  onClick={() => void ask(a.label, a.key)}
                  className="af-focus px-3 py-2 bg-card text-foreground rounded-md hover:bg-muted text-[13px] border border-border"
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : ''}`}>
            <div
              className={`max-w-[85%] rounded-lg px-4 py-3 ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted border border-border text-foreground'}`}
            >
              {msg.role === 'assistant' ? (
                <div
                  className="text-[14px] leading-relaxed whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                />
              ) : (
                <p className="text-[14px]">{msg.content}</p>
              )}
            </div>
          </div>
        ))}
        <p aria-live="polite" className="text-[13px] text-muted-foreground">
          {isStreaming ? 'Writing an answer…' : ''}
        </p>
        <div ref={messagesEndRef} />
      </div>

      {messages.length > 0 && (
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
          {quickActions.map(a => (
            <button
              type="button"
              key={a.key}
              onClick={() => void ask(a.label, a.key)}
              disabled={isStreaming}
              className="af-focus px-3 py-1.5 bg-card text-foreground rounded-md hover:bg-muted text-[13px] border border-border whitespace-nowrap disabled:opacity-50"
            >
              {a.label}
            </button>
          ))}
        </div>
      )}

      <form
        className="flex items-center gap-2 mt-3"
        onSubmit={e => {
          e.preventDefault();
          handleSend();
        }}
      >
        <label htmlFor="ai-question" className="sr-only">
          Question about this patient
        </label>
        <input
          id="ai-question"
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask about this patient"
          disabled={isStreaming}
          className="flex-1 bg-card border border-input rounded-md px-3 py-2.5 text-[14px] outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:opacity-50"
        />
        <button
          type="submit"
          aria-label="Send question"
          disabled={isStreaming || !input.trim()}
          className="af-focus w-11 h-11 bg-primary text-primary-foreground rounded-md flex items-center justify-center hover:bg-primary-strong disabled:opacity-50"
        >
          <Send className="w-5 h-5" aria-hidden />
        </button>
      </form>
    </div>
  );
}
