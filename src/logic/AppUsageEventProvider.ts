import { ReactElement, useEffect } from 'react';

import { AppUsageApplication } from '../domain/AppUsageApplication';
import { isCurrentlyServerSide } from '../utils/isCurrentlyServerside';
import { autocaptureActivityEvents } from './capture/autocaptureActivityEvents';
import { autocaptureDeviceEvents } from './capture/autocaptureDeviceEvents';
import { autocaptureNetworkEvents } from './capture/autocaptureNetworkEvents';
import { autocaptureRuntimeEvents } from './capture/autocaptureRuntimeEvents';
import { autocaptureScreenEvents } from './capture/autocaptureScreenEvents';
import { requeueTasksEmitToRemoteOnLoad } from './emit/asyncTask/requeueTasksEmitToRemoteOnLoad';
import { setApiCredentials } from './emit/getApiCredentials';
import { setApplicationOfSession } from './session/getApplicationOfSession';

export const AppUsageEventProvider = ({
  apiKey,
  apiHost,
  application,
}: {
  apiKey: string;
  apiHost: string;
  application: AppUsageApplication;
}): ReactElement | null => {
  // set the api credentials
  useEffect(() => {
    if (isCurrentlyServerSide()) return; // do nothing if on serverside
    setApiCredentials({ apiKey, apiHost });
  }, [apiKey, apiHost]);

  // set the application
  useEffect(() => {
    if (isCurrentlyServerSide()) return; // do nothing if on serverside
    setApplicationOfSession(application);
  }, [application]);

  // instantiate the listeners and emitters
  useEffect(() => {
    if (isCurrentlyServerSide()) return; // do nothing if on serverside

    // instantiate the listeners
    autocaptureNetworkEvents();
    autocaptureDeviceEvents();
    autocaptureRuntimeEvents();
    autocaptureScreenEvents();
    autocaptureActivityEvents();

    // instantiate the emitters
    void requeueTasksEmitToRemoteOnLoad();
  }, []);

  // no component to display
  return null;
};
