import { Logtail } from '@logtail/node';

const logtail = process.env.LOGTAIL_TOKEN
  ? new Logtail(process.env.LOGTAIL_TOKEN)
  : null;

export const logger = {
  info: (message: string, meta?: Record<string, any>) => {
    console.log(`[INFO] ${message}`, meta);
    logtail?.info(message, meta);
  },

  error: (message: string, meta?: Record<string, any>) => {
    console.error(`[ERROR] ${message}`, meta);
    logtail?.error(message, meta);
  },

  audit: (action: string, userId: string, resourceId: string, meta?: Record<string, any>) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      action,
      userId,
      resourceId,
      ...meta,
    };
    console.log(`[AUDIT] ${action}`, logEntry);
    logtail?.info(`[AUDIT] ${action}`, logEntry);
  },
};
