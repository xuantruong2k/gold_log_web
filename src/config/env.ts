interface Env {
  API_BASE_URL: string;
  OAUTH_REDIRECT_URI: string;
  ENVIRONMENT: 'development' | 'staging' | 'production';
}

function validateEnv(): Env {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  const oauthRedirectUri = import.meta.env.VITE_OAUTH_REDIRECT_URI;
  const environment = import.meta.env.VITE_ENVIRONMENT || 'development';

  if (!apiBaseUrl || !oauthRedirectUri) {
    throw new Error('Missing required environment variables');
  }

  return {
    API_BASE_URL: apiBaseUrl,
    OAUTH_REDIRECT_URI: oauthRedirectUri,
    ENVIRONMENT: environment as Env['ENVIRONMENT'],
  };
}

export const env = validateEnv();
