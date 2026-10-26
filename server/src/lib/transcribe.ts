import { readFileSync } from 'node:fs';
import { env } from './env.js';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const GEMINI_UPLOAD_URL = 'https://generativelanguage.googleapis.com/upload/v1beta/files';
const GEMINI_MODEL = 'gemini-3.8-flash';
const GEMINI_INLINE_AUDIO_LIMIT = 14 * 1024 * 1024;
const TRANSCRIPTION_PROMPT =
  'Transcribe the speech verbatim. Keep speaker turns with labels when clear. Return only the transcript. Do not summarize or infer details.';

type GeminiAudioInput =
  | { type: 'audio'; data: string; mime_type: string }
  | { type: 'audio'; uri: string; mime_type: string };

type GeminiFile = {
  name?: string;
  uri?: string;
  mimeType?: string;
  state?: string;
};

type UploadedGeminiFile = { name: string; uri: string; mimeType: string; state?: string };

type GeminiInteraction = { outputs?: { type?: string; text?: string }[] };

const FILLER = [
  'Patient reports increased fatigue over the past two weeks.',
  'Doctor: Any chest pain or shortness of breath?',
  'Patient: No chest pain. Slight shortness of breath after climbing stairs.',
  'Doctor: Are you taking your Metformin twice daily?',
  'Patient: Yes, but I missed two doses last weekend.',
  'Doctor: We will order a fasting glucose and HbA1c. Continue current medication.',
];

function getAudioBuffer(file: { path?: string; buffer?: Buffer }): Buffer {
  return file.buffer ?? readFileSync(file.path!);
}

function audioMimeType(mime: string): string {
  return mime.split(';', 1)[0] || 'audio/webm';
}

function geminiFileUrl(name: string): string {
  const prefix = 'files/';
  if (!name.startsWith(prefix)) throw new Error('Gemini returned an invalid file name');
  return `${GEMINI_API_BASE}/files/${encodeURIComponent(name.slice(prefix.length))}`;
}

async function uploadGeminiAudio(
  apiKey: string,
  audio: Buffer,
  mimeType: string
): Promise<UploadedGeminiFile> {
  const start = await fetch(GEMINI_UPLOAD_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
      'X-Goog-Upload-Protocol': 'resumable',
      'X-Goog-Upload-Command': 'start',
      'X-Goog-Upload-Header-Content-Length': String(audio.length),
      'X-Goog-Upload-Header-Content-Type': mimeType,
    },
    body: JSON.stringify({ file: { display_name: 'medcore-audio-transcription' } }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!start.ok) throw new Error(`Gemini file upload initialization failed (${start.status})`);
  const uploadUrl = start.headers.get('x-goog-upload-url');
  if (!uploadUrl) throw new Error('Gemini file upload URL missing');

  const upload = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'X-Goog-Upload-Offset': '0',
      'X-Goog-Upload-Command': 'upload, finalize',
    },
    body: new Uint8Array(audio),
    signal: AbortSignal.timeout(60_000),
  });
  if (!upload.ok) throw new Error(`Gemini audio upload failed (${upload.status})`);
  const response = (await upload.json()) as { file?: GeminiFile };
  const file = response.file;
  if (!file?.name?.startsWith('files/') || !file.uri) {
    throw new Error('Gemini audio upload returned incomplete file metadata');
  }
  return { name: file.name, uri: file.uri, mimeType: file.mimeType ?? mimeType, state: file.state };
}

async function waitForGeminiAudio(apiKey: string, uploaded: UploadedGeminiFile): Promise<string> {
  let file: GeminiFile = uploaded;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (file.state === 'FAILED') throw new Error('Gemini audio processing failed');
    if (file.state === 'ACTIVE') {
      if (file.uri) return file.uri;
      throw new Error('Gemini audio URI missing');
    }
    const response = await fetch(geminiFileUrl(uploaded.name), {
      headers: { 'x-goog-api-key': apiKey },
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) throw new Error(`Gemini file status request failed (${response.status})`);
    file = (await response.json()) as GeminiFile;
    if (file.state !== 'ACTIVE') await new Promise<void>(resolve => setTimeout(resolve, 1000));
  }
  throw new Error('Gemini audio processing timed out');
}

async function deleteGeminiAudio(apiKey: string, fileName: string): Promise<void> {
  try {
    const response = await fetch(geminiFileUrl(fileName), {
      method: 'DELETE',
      headers: { 'x-goog-api-key': apiKey },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) console.error('[gemini] audio cleanup failed', response.status);
  } catch {
    console.error('[gemini] audio cleanup request failed');
  }
}

async function transcribeWithGemini(
  file: { path?: string; buffer?: Buffer; mime: string },
  apiKey: string
): Promise<string | null> {
  const audio = getAudioBuffer(file);
  const mimeType = audioMimeType(file.mime);
  let uploadedFile: UploadedGeminiFile | null = null;
  try {
    let audioInput: GeminiAudioInput;
    if (audio.length > GEMINI_INLINE_AUDIO_LIMIT) {
      uploadedFile = await uploadGeminiAudio(apiKey, audio, mimeType);
      const uri = await waitForGeminiAudio(apiKey, uploadedFile);
      audioInput = { type: 'audio', uri, mime_type: uploadedFile.mimeType };
    } else {
      audioInput = { type: 'audio', data: audio.toString('base64'), mime_type: mimeType };
    }

    const response = await fetch(`${GEMINI_API_BASE}/interactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        model: GEMINI_MODEL,
        input: [{ type: 'text', text: TRANSCRIPTION_PROMPT }, audioInput],
      }),
      signal: AbortSignal.timeout(60_000),
    });
    if (!response.ok) {
      console.error('[gemini] transcription request failed', response.status);
      return null;
    }
    const result = (await response.json()) as GeminiInteraction;
    return (
      result.outputs
        ?.filter(output => output.type === 'text')
        .map(output => output.text ?? '')
        .join('\n')
        .trim() || null
    );
  } catch (error) {
    console.error('[gemini] transcription failed', error instanceof Error ? error.message : 'unknown error');
    return null;
  } finally {
    if (uploadedFile) await deleteGeminiAudio(apiKey, uploadedFile.name);
  }
}

export async function transcribeAudio(file: {
  path?: string;
  buffer?: Buffer;
  mime: string;
}): Promise<{ text: string; provider: 'gemini' | 'groq' | 'mock' }> {
  if (env.GROQ_API_KEY) {
    const blob = new Blob([new Uint8Array(getAudioBuffer(file))], { type: file.mime });
    const formData = new FormData();
    formData.append('file', blob, 'audio.webm');
    formData.append('model', 'whisper-large-v3');
    try {
      const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.GROQ_API_KEY}` },
        body: formData,
      });
      const data = (await res.json()) as { text?: string; error?: { message: string } };
      if (data.error) {
        console.error('[whisper] error', data.error.message);
        return { text: FILLER.join('\n'), provider: 'mock' };
      }
      return { text: data.text ?? '', provider: 'groq' };
    } catch (err) {
      console.error('[whisper] failed', err);
      return { text: FILLER.join('\n'), provider: 'mock' };
    }
  }

  if (env.GEMINI_API_KEY) {
    const text = await transcribeWithGemini(file, env.GEMINI_API_KEY);
    return text ? { text, provider: 'gemini' } : { text: FILLER.join('\n'), provider: 'mock' };
  }

  return { text: FILLER.join('\n'), provider: 'mock' };
}

export function structureNoteFromTranscript(transcript: string) {
  const lines = transcript.split(/\n+/).filter(Boolean);
  const chiefComplaint = lines.find(l => /report|complain|present/i.test(l)) ?? lines[0] ?? '';
  const history =
    lines.filter(l => /history|past|previously|since/i.test(l)).join(' ') ||
    lines.slice(1, 3).join(' ');
  const assessment = lines.find(l => /assessment|likely|diagnos/i.test(l)) ?? '';
  const plan = lines.filter(l => /order|continue|start|stop|refer|prescribe/i.test(l)).join(' ');
  const followUp = lines.find(l => /follow[- ]up|return|review/i.test(l)) ?? '';
  return { chiefComplaint, history, assessment, plan, followUp };
}
