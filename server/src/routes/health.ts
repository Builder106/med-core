import { Router } from 'express';
import { env } from '../lib/env.js';
import { pushAvailable } from '../lib/push.js';

export const healthRouter = Router();

healthRouter.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'medcore-api',
    time: new Date().toISOString(),
    integrations: {
      groq: Boolean(env.GROQ_API_KEY),
      gemini: Boolean(env.GEMINI_API_KEY),
      daily: Boolean(env.DAILY_API_KEY),
      africasTalking: Boolean(env.AT_API_KEY),
      webPush: pushAvailable(),
    },
  });
});
