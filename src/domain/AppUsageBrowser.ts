import { DomainValueObject } from 'domain-objects';

/**
 * a browser which an application is accessed through
 */
export interface AppUsageBrowser {
  /**
   * the user agent claimed by the browser
   */
  userAgentClaim: string;
}
export class AppUsageBrowser
  extends DomainValueObject<AppUsageBrowser>
  implements AppUsageBrowser {}
