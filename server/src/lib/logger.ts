type Level = 'debug' | 'info' | 'warn' | 'error';

export type LogMetaValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Error
  | LogMetaValue[]
  | { [key: string]: LogMetaValue };

export type LogMeta = Record<string, LogMetaValue>;

function emit(level: Level, msg: string, meta?: LogMeta) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...(meta ?? {}),
  };
  const line = JSON.stringify(entry);
  if (level === 'error' || level === 'warn') {
    console.error(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  debug: (msg: string, meta?: LogMeta) => emit('debug', msg, meta),
  info: (msg: string, meta?: LogMeta) => emit('info', msg, meta),
  warn: (msg: string, meta?: LogMeta) => emit('warn', msg, meta),
  error: (msg: string, meta?: LogMeta) => emit('error', msg, meta),
};
