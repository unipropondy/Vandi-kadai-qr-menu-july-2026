import axios from 'axios';

// Get API URL from env, default to localhost:3000 if not set
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

export const registerCustomer = async (customerData) => {
  try {
    const response = await api.post('/customer/register', customerData);
    return response.data;
  } catch (error) {
    // Handle network timeout or server errors gracefully
    if (error.code === 'ECONNABORTED') {
      throw new Error('Network timeout. Please check your internet connection and try again.');
    }
    if (error.response && error.response.data) {
      throw new Error(error.response.data.message || 'Registration failed. Please try again.');
    }
    throw new Error(error.message || 'Failed to connect to the server. Please try again later.');
  }
};

export default api;
