import axios from 'axios'

const API_BASE_URL = process.env.NODE_ENV === 'development' ? '' : '/api';

export const apiClient = axios.create(
    {
        baseURL: API_BASE_URL,
        headers: {
            'Content-Type': 'application/json',
        },
    }
);
