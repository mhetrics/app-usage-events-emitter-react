import { DomainEntity } from 'domain-objects';

import { AppUsageApplication } from './AppUsageApplication';
import { AppUsageBrowser } from './AppUsageBrowser';
import { AppUsageDevice } from './AppUsageDevice';
import { AppUsageNetwork } from './AppUsageNetwork';

/**
 * a unique session within which an agent is using an app
 *
 * note
 * - the app usage session is emitted only once per session and referenced by events
 * - the properties of the session do not vary over time, so we normalize them out onto the session to save space on the events
 */
export interface AppUsageSession {
  /**
   * a unique identifier for the session
   *
   * note
   * - this is managed by the app
   */
  uuid: string;

  /**
   * a unique identifier for the unique installation of this application on the user's device
   */
  installationUuid: string;

  /**
   * the application this session was conducted in
   */
  application: AppUsageApplication;

  /**
   * the device this session was conducted from
   *
   * note
   * - this may be null when application is accessed through a browser
   */
  device: AppUsageDevice | null;

  /**
   * the network this session was conducted over
   *
   * note
   * - this is typically only added on the server side, upon consumption of the event
   */
  network: AppUsageNetwork | null;

  /**
   * a reference to the browser value-object this session was conducted from
   *
   * note
   * - this will only exist for web applications
   */
  browser: AppUsageBrowser | null;

  /**
   * the mechanism this session's data was emitted via
   */
  // mechanism: AppUsageEmissionMechanism; // TODO: expose this eventually
}
export class AppUsageSession
  extends DomainEntity<AppUsageSession>
  implements AppUsageSession
{
  public static nested = {
    application: AppUsageApplication,
    device: AppUsageDevice,
    network: AppUsageNetwork,
    browser: AppUsageBrowser,
  };
}
