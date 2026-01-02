import { jwtDecode } from 'jwt-decode';
import * as api from './api';

interface DecodedToken {
  role: string;
  sub: number;
  username: string;
  // ... other properties
}

export const getUserRole = (): string | null => {
  const token = localStorage.getItem('access_token');
  if (!token) {
    return null;
  }
  try {
  const decodedToken: DecodedToken = jwtDecode(token) as DecodedToken;
    return decodedToken.role;
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await api.getCurrentUser();
    return response.data;
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
};
