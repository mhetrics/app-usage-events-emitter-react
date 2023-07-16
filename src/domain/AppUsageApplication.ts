import { DomainValueObject } from 'domain-objects';

export enum AppUsageApplicationPlatform {
  WEB = 'WEB',
  NATIVE = 'NATIVE',
}

/**
 * an application which can be used by an agent
 */
export interface AppUsageApplication {
  /**
   * the platform this application is running on
   */
  platform: AppUsageApplicationPlatform;

  /**
   * the name of the application
   */
  name: string;

  /**
   * the version of the deployed code, if available
   */
  version: string | null;

  /**
   * the commit hash of the deployed code, if available
   *
   * note
   * - this is an even more specific way to pinpoint the version of the application
   */
  commit: string | null;
}
export class AppUsageApplication
  extends DomainValueObject<AppUsageApplication>
  implements AppUsageApplication {}
