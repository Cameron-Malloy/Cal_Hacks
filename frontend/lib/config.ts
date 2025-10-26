/**
 * Configuration for backend API
 */

export const config = {
  /**
   * Backend API URL
   * Default: http://localhost:5000
   */
  backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000',
} as const;
