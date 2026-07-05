import { createLogger } from '@itbengal/logger';
import { appConfig } from '../config/app.js';

export const logger = createLogger({
  service: appConfig.appName || 'api',
  level: appConfig.nodeEnv === 'development' ? 'debug' : 'info',
});

export default logger;
