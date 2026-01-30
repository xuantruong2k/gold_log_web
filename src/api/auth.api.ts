import { apiClient } from './client';
import { apiLoginResponseToLoginResponse } from './transformers';
import type { LoginResponse } from '@/types/user.types';
import type { ApiLoginResponse } from './types';

export interface AuthorizationUrlResponse {
  authorizationUrl: string;
  state: string;
}

export interface OAuthCallbackRequest {
  code: string;
  state: string;
}

export const authApi = {
  /**
   * Get OAuth authorization URL for redirecting user to provider
   * @param provider - OAuth provider (e.g., 'google')
   * @param redirectUri - Frontend callback URL
   * @returns Authorization URL and CSRF state token
   */
  async getAuthorizationUrl(
    provider: string,
    redirectUri: string
  ): Promise<AuthorizationUrlResponse> {
    const response = await apiClient.get<{
      authorization_url: string;
      state: string;
    }>(`/auth/oauth/${provider}/url`, {
      params: { redirectUri },
    });

    return {
      authorizationUrl: response.data.authorization_url,
      state: response.data.state,
    };
  },

  /**
   * Exchange OAuth authorization code for JWT token
   * @param provider - OAuth provider (e.g., 'google')
   * @param request - Authorization code and state from OAuth callback
   * @returns Login response with JWT token and user info
   */
  async handleOAuthCallback(
    provider: string,
    request: OAuthCallbackRequest
  ): Promise<LoginResponse> {
    const response = await apiClient.post<ApiLoginResponse>(`/auth/oauth/${provider}/callback`, {
      code: request.code,
      state: request.state,
    });

    return apiLoginResponseToLoginResponse(response.data);
  },

  /**
   * Get current authenticated user information
   * @returns Current user details
   */
  async getCurrentUser() {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  /**
   * Logout and invalidate current JWT token
   */
  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },
};
