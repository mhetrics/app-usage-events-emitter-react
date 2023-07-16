// track the application in memory
let credentials: { apiKey: string; apiHost: string } | null = null;

export const setApiCredentials = (set: { apiKey: string; apiHost: string }) =>
  (credentials = set);

export const getApiCredentials = (): { apiKey: string; apiHost: string } => {
  if (!credentials) throw new Error('credentials not set yet');
  return credentials;
};
