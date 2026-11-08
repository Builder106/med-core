import { Activity, ChevronDown, ChevronUp, Phone, PhoneOff, StickyNote, Video } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ClinicalText } from '../components/clinical/ClinicalText';
import { useApp } from '../context/AppContext';
import { buildVideoRoomEmbedUrl } from '../lib/videoRoomUrl';
import {
  createVideoSession,
  endVideoSession,
  saveConsultationNote,
  startVideoSession,
} from '../services/api';

type Bandwidth = 'good' | 'fair' | 'poor';
type Phase = 'pre' | 'in' | 'post';

export function VideoConsultPage() {
  const { t } = useTranslation();
  const { currentPatientId, currentUserId } = useApp();
  const [phase, setPhase] = useState<Phase>('pre');
  const [bandwidth, setBandwidth] = useState<Bandwidth>('good');
  const [reason, setReason] = useState('Routine follow-up');
  const [session, setSession] = useState<{ id: string; url: string; provider: string } | null>(
    null
  );
  const [notes, setNotes] = useState('');
  const [duration, setDuration] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [micReady, setMicReady] = useState(false);
  const [mobileNotesOpen, setMobileNotesOpen] = useState(false);
  const [mobileRoomOpen, setMobileRoomOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);

  const embedUrl = useMemo(() => (session ? buildVideoRoomEmbedUrl(session.url) : ''), [session]);

  async function testDevices() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraReady(stream.getVideoTracks().length > 0);
      setMicReady(stream.getAudioTracks().length > 0);
    } catch {
      setCameraReady(false);
      setMicReady(false);
    }
  }

  useEffect(() => {
    testDevices();
    return () => {
      streamRef.current?.getTracks().forEach(tr => tr.stop());
    };
  }, []);

  useEffect(() => {
    if (phase !== 'in') return;
    const mq = window.matchMedia('(max-width: 1023px)');
    if (!mq.matches) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== 'in') {
      setMobileNotesOpen(false);
      setMobileRoomOpen(false);
    }
  }, [phase]);

  async function start() {
    const res = await createVideoSession({
      patientId: currentPatientId,
      doctorId: currentUserId,
      reason,
    });
    setSession({ id: res.id, url: res.room.url, provider: res.room.provider });
    await startVideoSession(res.id);
    setPhase('in');
    setDuration(0);
    timerRef.current = window.setInterval(() => setDuration(d => d + 1), 1000);
  }

  async function end() {
    if (!session) return;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    await endVideoSession(session.id, notes);
    setPhase('post');
  }

  async function saveNote() {
    if (!session) return;
    await saveConsultationNote({
      patientId: currentPatientId,
      doctorId: currentUserId,
      plan: notes,
      assessment: `Video consult — ${reason}`,
    });
    setPhase('pre');
    setSession(null);
    setNotes('');
    setDuration(0);
  }

  const fmt = (n: number) =>
    `${Math.floor(n / 60)
      .toString()
      .padStart(2, '0')}:${(n % 60).toString().padStart(2, '0')}`;

  return (
    <div className="lg:space-y-6 max-w-5xl lg:mx-auto">
      <div className="max-lg:hidden">
        <h1 className="text-[22px] font-semibold text-foreground flex items-center gap-2">
          <Video className="w-6 h-6 text-primary" />
          {t('nav.videoConsult')}
        </h1>
      </div>
      {phase !== 'in' && (
        <div className="lg:hidden mb-2">
          <h1 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Video className="w-5 h-5 text-primary" />
            {t('nav.videoConsult')}
          </h1>
        </div>
      )}

      {phase === 'pre' && (
        <section className="rounded-xl max-lg:rounded-xl border border-border bg-card p-4 max-lg:p-4 space-y-4 max-lg:space-y-3">
          <h2 className="text-[15px] font-semibold text-foreground">{t('video.preCall')}</h2>
          <div className="grid lg:grid-cols-2 gap-4 max-lg:gap-3">
            <div className="space-y-3 max-lg:order-2">
              <label className="text-xs text-muted-foreground flex flex-col gap-1">
                {t('video.namePatient')}
                <input
                  readOnly
                  className="af-focus rounded-lg border border-input px-3 py-2.5 text-sm bg-muted"
                  value={currentPatientId}
                />
              </label>
              <label className="text-xs text-muted-foreground flex flex-col gap-1">
                {t('video.nameDoctor')}
                <input
                  readOnly
                  className="af-focus rounded-lg border border-input px-3 py-2.5 text-sm bg-muted"
                  value={currentUserId}
                />
              </label>
              <label className="text-xs text-muted-foreground flex flex-col gap-1">
                {t('video.reason')}
                <input
                  className="af-focus rounded-lg border border-input px-3 py-2.5 text-sm"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                />
              </label>
              <label className="text-xs text-muted-foreground flex flex-col gap-1">
                {t('video.bandwidth')}
                <select
                  className="af-focus rounded-lg border border-input px-3 py-2.5 text-sm"
                  value={bandwidth}
                  onChange={e => setBandwidth(e.target.value as Bandwidth)}
                >
                  <option value="good">{t('video.good')}</option>
                  <option value="fair">{t('video.fair')}</option>
                  <option value="poor">{t('video.poor')}</option>
                </select>
              </label>
            </div>
            <div className="space-y-3 max-lg:order-1">
              <div className="rounded-xl max-lg:rounded-lg overflow-hidden bg-black aspect-video max-lg:aspect-[9/16] max-lg:min-h-[42vh] max-lg:max-h-[52vh] relative max-lg:shadow-lg">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                {!cameraReady && (
                  <div className="absolute inset-0 flex items-center justify-center text-white text-xs px-4 text-center">
                    Camera preview unavailable. Allow access or connect on a phone.
                  </div>
                )}
              </div>
              <div className="text-xs text-muted-foreground flex flex-wrap gap-2">
                <span
                  className={`px-2 py-1 rounded border ${cameraReady ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}
                >
                  Camera {cameraReady ? 'ok' : 'off'}
                </span>
                <span
                  className={`px-2 py-1 rounded border ${micReady ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}
                >
                  Mic {micReady ? 'ok' : 'off'}
                </span>
                <button
                  type="button"
                  onClick={testDevices}
                  className="af-press af-focus px-2 py-1 rounded border border-border bg-muted"
                >
                  {t('video.deviceTest')}
                </button>
              </div>
            </div>
          </div>
          <button
            onClick={start}
            className="af-press af-focus w-full max-lg:min-h-[48px] bg-primary text-sidebar-foreground px-4 py-3 rounded-xl text-sm flex items-center justify-center gap-2 font-medium"
          >
            <Phone className="w-5 h-5" />
            {t('video.startCall')}
          </button>
          <p className="text-[12px] text-muted-foreground">{t('video.disclaimer')}</p>
        </section>
      )}

      {phase === 'in' && session && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-[100] flex flex-col bg-black overscroll-none touch-manipulation"
            style={{
              paddingTop: 'env(safe-area-inset-top, 0px)',
              minHeight: '100dvh',
              height: '100dvh',
            }}
          >
            {bandwidth === 'poor' && (
              <div className="shrink-0 bg-amber-500/95 text-amber-950 px-3 py-2 text-xs text-center font-medium">
                {t('video.audioOnlyBanner')}
              </div>
            )}
            <header className="shrink-0 flex items-center justify-between gap-2 px-3 py-2.5 bg-black/80 border-b border-white/10 text-white">
              <span className="flex items-center gap-2 min-w-0 text-[13px]">
                <span className="shrink-0 flex items-center gap-2">
                  <span className="rounded bg-red-700 px-1.5 py-0.5 text-[12px] font-medium">
                    {t('video.liveBadge', { defaultValue: 'Live' })}
                  </span>
                  <span className="font-medium tabular-nums">{fmt(duration)}</span>
                </span>
                <span className="truncate text-white/80 text-[12px]">
                  <ClinicalText as="span">{session.provider}</ClinicalText>
                </span>
              </span>
            </header>
            <div className="flex-1 min-h-0 relative bg-black">
              <iframe
                title="video-room"
                src={embedUrl}
                allow="camera; microphone; autoplay; fullscreen; display-capture"
                className="absolute inset-0 w-full h-full border-0"
                style={{ width: '100%', height: '100%' }}
              />
            </div>
            <div
              className="shrink-0 flex flex-col bg-gradient-to-t from-black via-black/95 to-transparent pt-2"
              style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}
            >
              {mobileNotesOpen && (
                <div className="mx-3 mb-2 rounded-xl border border-white/15 bg-zinc-900/95 p-3 max-h-[32vh] flex flex-col shadow-xl">
                  <label className="text-[12px] text-zinc-400 mb-1.5">{t('video.notes')}</label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={4}
                    className="af-focus flex-1 min-h-[88px] rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 resize-none"
                    placeholder={t('video.notesPlaceholder', {
                      defaultValue: 'Quick consult notes…',
                    })}
                  />
                </div>
              )}
              <div className="flex items-end justify-center gap-6 px-4 pb-1">
                <button
                  type="button"
                  onClick={() => {
                    setMobileNotesOpen(o => !o);
                    setMobileRoomOpen(false);
                  }}
                  className={`af-tap flex flex-col items-center gap-1.5 min-w-[56px] ${mobileNotesOpen ? 'text-white' : 'text-zinc-300'}`}
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 border border-white/15">
                    {mobileNotesOpen ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <StickyNote className="w-5 h-5" />
                    )}
                  </span>
                  <span className="text-[12px]">{t('video.notes')}</span>
                </button>
                <button
                  type="button"
                  onClick={end}
                  className="af-tap flex flex-col items-center gap-1.5"
                >
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white shadow-lg shadow-red-900/40 ring-4 ring-red-900/30">
                    <PhoneOff className="w-7 h-7" aria-hidden />
                  </span>
                  <span className="text-[12px] text-red-200 font-medium">{t('video.endCall')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileRoomOpen(o => !o);
                    setMobileNotesOpen(false);
                  }}
                  className={`af-tap flex flex-col items-center gap-1.5 min-w-[56px] ${mobileRoomOpen ? 'text-white' : 'text-zinc-300'}`}
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 border border-white/15">
                    {mobileRoomOpen ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <Activity className="w-5 h-5" />
                    )}
                  </span>
                  <span className="text-[12px]">
                    {t('video.roomDetails', { defaultValue: 'Details' })}
                  </span>
                </button>
              </div>
              {mobileRoomOpen && (
                <div className="mx-3 mt-2 rounded-xl border border-white/10 bg-zinc-900/90 px-3 py-2 text-[12px] text-zinc-400 max-h-24 overflow-y-auto">
                  <p className="text-zinc-500 mb-1">
                    {t('video.roomUrlLabel', { defaultValue: 'Room' })}
                  </p>
                  <ClinicalText className="block font-mono break-all text-zinc-200 text-[12px] leading-relaxed">
                    {session.url}
                  </ClinicalText>
                </div>
              )}
              <p className="text-center text-[12px] text-zinc-500 px-4 pt-2">
                {t('video.disclaimer')}
              </p>
            </div>
          </div>

          <section className="hidden lg:block rounded-xl border border-border bg-card overflow-hidden">
            {bandwidth === 'poor' && (
              <div className="bg-amber-50 border-b border-amber-200 text-amber-800 px-4 py-2 text-xs">
                {t('video.audioOnlyBanner')}
              </div>
            )}
            <div className="p-3 flex items-center justify-between text-xs text-muted-foreground border-b border-border">
              <span className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Live, <ClinicalText>{session.provider}</ClinicalText>, {fmt(duration)}
              </span>
              <button
                onClick={end}
                className="af-press af-focus bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-2"
              >
                <PhoneOff className="w-3.5 h-3.5" />
                {t('video.endCall')}
              </button>
            </div>
            <div className="relative aspect-video max-h-[min(72vh,820px)] bg-black min-h-[320px]">
              <iframe
                title="video-room-desktop"
                src={embedUrl}
                allow="camera; microphone; autoplay; fullscreen; display-capture"
                className="absolute inset-0 w-full h-full border-0"
              />
            </div>
            <div className="p-4 grid md:grid-cols-2 gap-3">
              <label className="text-xs text-muted-foreground flex flex-col gap-1">
                {t('video.notes')}
                <textarea
                  rows={4}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="af-focus rounded-lg border border-border px-3 py-2 text-sm"
                />
              </label>
              <div className="text-xs text-muted-foreground">
                <p>Room URL (demo):</p>
                <ClinicalText className="block font-mono break-all">{session.url}</ClinicalText>
              </div>
            </div>
            <p className="px-4 pb-4 text-[12px] text-muted-foreground">{t('video.disclaimer')}</p>
          </section>
        </>
      )}

      {phase === 'post' && session && (
        <section className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h2 className="text-[15px] font-semibold text-foreground">{t('video.postCall')}</h2>
          <p className="text-sm text-foreground">Duration: {fmt(duration)}</p>
          <label className="text-xs text-muted-foreground flex flex-col gap-1">
            {t('video.notes')}
            <textarea
              rows={5}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="af-focus rounded-lg border border-border px-3 py-2 text-sm"
            />
          </label>
          <button
            onClick={saveNote}
            className="af-press af-focus bg-primary text-sidebar-foreground px-4 py-2 rounded-xl text-sm"
          >
            {t('common.save')}
          </button>
        </section>
      )}
    </div>
  );
}
