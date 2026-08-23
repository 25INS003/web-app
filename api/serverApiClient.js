// src/api/serverApiClient.js
import axios from "axios";

export const createServerApiClient = () => {
    const client = axios.create({
        // This client runs on the server, so it needs an absolute origin on the
        // container network — the relative "/api/v1" the browser uses has
        // nothing to resolve against here. Same source of truth as
        // src/lib/auth/session.server.ts.
        //
        // It read NEXT_PUBLIC_API_URL first, which is the browser's value and
        // the wrong one for this side; the fallback then pointed at localhost,
        // which inside the pod is the Next server itself, not the backend.
        // Nothing imports this module today — the fix is here so it is not a
        // trap for whoever does.
        baseURL:
            process.env.API_INTERNAL_URL ||
            "http://ins03-backend-dev:8000/api/v1",
        timeout: 20000,
        withCredentials: true, // send cookies automatically
    });
    return client;
};
