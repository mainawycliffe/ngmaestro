import { onCallGenkit } from 'firebase-functions/https';
import './config';
import { theOracleFlow } from './flows';

export const theOracle = onCallGenkit(
  {
    timeoutSeconds: 5 * 60,
  },
  theOracleFlow,
);
