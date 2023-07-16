import { differenceInHours } from 'date-fns';
import { deserialize, serialize } from 'domain-objects';
import { createCache } from 'simple-in-memory-cache';
import { omit } from 'type-fns';
import { v4 as uuid } from 'uuid';
import { withSimpleCaching } from 'with-simple-caching';

import { AppUsageBrowser } from '../../domain/AppUsageBrowser';
import { AppUsageSession } from '../../domain/AppUsageSession';
import { queueTaskEmitToRemote } from '../emit/asyncTask/queueTaskEmitToRemote';
import { base64EncodeCompressedPayload } from '../emit/compression/base64EncodeCompressedPayload';
import { serializeAndCompressPayload } from '../emit/compression/serializeAndCompressPayload';
import { SessionLastUsedAtEvent } from './captureSessionLastUsedAt';
import { findOrCreateInstallationUuid } from './findOrCreateInstallationUuid';
import { getApplicationOfSession } from './getApplicationOfSession';

const SESSION_STORAGE_KEY = 'app-usage-session';
export const SESSION_LAST_USE_KEY = 'app-usage-session-lastseenat';

/**
 * finds or creates the session for this app-usage-session
 *
 * note
 * - persists the session in localstorage, for lookup
 * - replaces the session if session specific data has changed
 * - wrapped with simple caching to prevent redundant calculations
 */
export const findOrCreateAppUsageSession = withSimpleCaching(
  async (): Promise<{
    uuid: string;
  }> => {
    // define what a new session would look like
    const sessionNew = new AppUsageSession({
      uuid: uuid(),
      installationUuid: await findOrCreateInstallationUuid(),
      application: getApplicationOfSession(),
      device: null, // no access to device info when in browser env
      network: null, // will be filled on serverside
      browser: new AppUsageBrowser({
        userAgentClaim: window.navigator.userAgent,
      }),
    });

    // check if a session exists already
    const sessionFoundJSON = localStorage.getItem(SESSION_STORAGE_KEY);
    const sessionFound = sessionFoundJSON
      ? (deserialize(sessionFoundJSON, {
          with: [AppUsageSession],
        }) as AppUsageSession)
      : null;
    const sessionLastUsedAtJSON = localStorage.getItem(SESSION_LAST_USE_KEY);
    const sessionLastUsedAt = sessionLastUsedAtJSON
      ? (() => {
          const { sessionUuid, lastUsedAtMse } = JSON.parse(
            sessionLastUsedAtJSON,
          ) as SessionLastUsedAtEvent;

          // if the last used at mse was recorded for a different session, then it is not applicable here
          if (sessionFound?.uuid !== sessionUuid) return null;

          // otherwise, its applicable
          return lastUsedAtMse;
        })()
      : null;

    // evaluate if found session is still valid, if one was found
    const sessionFoundHasSameStaticData =
      sessionFound &&
      serialize(omit(sessionNew, ['uuid'])) ===
        serialize(omit(sessionFound, ['uuid']));
    const sessionFoundUsedWithinLastHour =
      sessionFound &&
      sessionLastUsedAt &&
      Math.abs(differenceInHours(sessionLastUsedAt, new Date().getTime())) <= 1;

    // if the session exists and is still valid, return it
    if (
      // session exists
      sessionFound &&
      // session static data is the same
      sessionFoundHasSameStaticData &&
      // session was last used within an hour
      sessionFoundUsedWithinLastHour
    )
      return sessionFound;

    // otherwise, save and return the new session
    await queueTaskEmitToRemote({
      endpoint: '/capture/session',
      payload: base64EncodeCompressedPayload(
        serializeAndCompressPayload(sessionNew),
      ),
    });
    localStorage.setItem(SESSION_STORAGE_KEY, serialize(sessionNew));
    return sessionNew;
  },
  {
    cache: createCache({
      defaultSecondsUntilExpiration: 5 * 60, // check max every 5 min
    }),
  },
);
