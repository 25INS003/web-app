// src/api/serverApiClient.js
import axios from "axios";

export const createServerApiClient = () => {
    const client = axios.create({
        baseURL:
            process.env.NEXT_PUBLIC_API_URL ||
            "https://nedyway.com/api/v1",
        timeout: 20000,
        withCredentials: true, // send cookies automatically
    });
    return client;
};
