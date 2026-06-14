"use client";

import { io, type Socket } from "socket.io-client";

// One shared socket connection for the whole app. Same-origin by default
// (nginx proxies /socket.io to the backend); if NEXT_PUBLIC_API_URL is an
// absolute URL we connect to that origin instead. Auth rides on the httpOnly
// cookies via withCredentials.
let socket: Socket | null = null;

function socketOrigin(): string | undefined {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (base && /^https?:\/\//.test(base)) {
    try {
      return new URL(base).origin;
    } catch {
      return undefined;
    }
  }
  return undefined; // same origin as the page
}

export function getSocket(): Socket {
  if (!socket) {
    const origin = socketOrigin();
    socket = origin
      ? io(origin, { withCredentials: true })
      : io({ withCredentials: true });
  }
  return socket;
}
