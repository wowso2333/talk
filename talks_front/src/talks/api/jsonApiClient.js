import axios from 'axios'

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL
    || 'https://talk-production-0d79.up.railway.app';

export const jsonApiClient = axios.create(
    {
        baseURL: API_BASE_URL,
        headers: {
            'Content-Type': 'application/json' // 確保包含這個標頭
        },
    },
);
