import { DomainValueObject } from 'domain-objects';

/**
 * a device which can run the application
 */
export interface AppUsageDevice {
  name: string | null;
  brand: string | null;
  manufacturer: string | null;
  model: {
    id: string | null;
    name: string | null;
    designName: string | null;
  };
  os: {
    name: string | null;
    version: string | null;
    buildId: string | null;
  };
}
export class AppUsageDevice
  extends DomainValueObject<AppUsageDevice>
  implements AppUsageDevice {}
