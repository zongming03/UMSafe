// API Configuration
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export const config = {
  apiUrl: API_URL,
  baseURL: `${API_URL}/admin`
};

export default config;
