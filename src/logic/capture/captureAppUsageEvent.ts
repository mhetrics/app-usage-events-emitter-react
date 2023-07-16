import { v4 as uuid } from 'uuid';

import { AppUsageEvent, AppUsageEventSource } from '../../domain/AppUsageEvent';
import { UnexpectedCodePathError } from '../../utils/errors/UnexpectedCodePathError';
import { appUsageEventsEmissionQueue } from '../emit/appUsageEventsEmissionQueue';
import { captureSessionLastUsedAt } from '../session/captureSessionLastUsedAt';
import { findOrCreateAppUsageSession } from '../session/findOrCreateAppUsageSession';

/**
 * a simple method for capturing an app usage event
 */
export const captureAppUsageEvent = async ({
  source,
  type,
  details,
}: {
  source: AppUsageEventSource;
  type: string;
  details: AppUsageEvent['details'];
}): Promise<AppUsageEvent> => {
  // get the session uuid
  const { uuid: sessionUuid } = await findOrCreateAppUsageSession();

  // validate that the type of the event is prefixed by the source
  const prefixExpected = `${source.toLowerCase()}.`;
  if (!type.startsWith(prefixExpected))
    throw new UnexpectedCodePathError(
      'captureAppUsageEvent expects type to be prefixed with source',
      { type, prefixExpected },
    );

  // create the event
  const event = new AppUsageEvent({
    uuid: uuid(),
    occurredAtMse: new Date().getTime(), // TODO: pull off of the event input instead, for better accuracy
    sessionUuid,
    route: window.location.href,
    source,
    type,
    details,
  });

  // queue it for emission
  appUsageEventsEmissionQueue.push(event);

  // record session usage
  await captureSessionLastUsedAt({
    sessionUuid,
    lastUsedAtMse: new Date().getTime(),
  });

  // and return it
  return event;
};
