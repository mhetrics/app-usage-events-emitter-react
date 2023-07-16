import { DomainValueObject } from 'domain-objects';

/**
 * a network which an application is accessed over
 */
export interface AppUsageNetwork {
  /**
   * the ip address used to network with the application
   */
  ipAddress: string;
}
export class AppUsageNetwork
  extends DomainValueObject<AppUsageNetwork>
  implements AppUsageNetwork {}
