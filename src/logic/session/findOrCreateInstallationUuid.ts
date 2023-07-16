import { createCache } from 'simple-in-memory-cache';
import { withSimpleCaching } from 'with-simple-caching';

import { uuid } from '../../deps';

const INSTALLATION_STORAGE_KEY = 'app-usage-installation';

/**
 * finds or creates the installation uuid for this device
 *
 * note
 * - installation uuids are "permanent" uuids assigned to the particular install of our app
 * - in the browser environment,
 *   - an "install" is considered as the first time that the app is loaded (i.e., local storage does not have the installation uuid)
 *   - an "uninstall" is considered as when the user clears their browsers cache (i.e., wipes local storage)
 * - therefore,
 *   - we simply find or create the uuid in localstorage
 */
export const findOrCreateInstallationUuid = withSimpleCaching(
  async () => {
    const found = localStorage.getItem(INSTALLATION_STORAGE_KEY);
    if (found) return found;
    const created = uuid();
    localStorage.setItem(INSTALLATION_STORAGE_KEY, created);
    return created;
  },
  {
    cache: createCache(),
  },
);
