import axios from 'axios'

const API_BASE_URL = 'http://localhost:8080';

export const jsonApiClient = axios.create(
    {
        baseURL: API_BASE_URL,
        headers: {
            'Content-Type': 'application/json' // 確保包含這個標頭
        },
    },
);
