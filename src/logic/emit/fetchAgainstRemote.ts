import { AppUsageEventEmissionError } from '../AppUsageEventEmissionError';
import { getApiCredentials } from './getApiCredentials';

export const fetchAgainstRemote = async ({
  endpoint,
  version,
  payload,
}: {
  endpoint: string;
  version: number;
  payload: Uint8Array;
}) => {
  const { apiKey, apiHost } = getApiCredentials();
  const response = await fetch(
    [
      apiHost.replace(/\/$/, ''),
      `v${version}`,
      endpoint.replace(/^\//, ''),
    ].join('/'),
    {
      method: 'POST',
      mode: 'cors',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: payload,
    },
  );
  if (response.status !== 200)
    throw new AppUsageEventEmissionError(
      'fetch against remote returned non successful status code',
      { status: response.status, body: response.body },
    );
};
