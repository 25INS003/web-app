import { api } from "@/lib/api/client";

export type BroadcastInput = {
  title: string;
  message: string;
  /** A path the clients resolve themselves — never an absolute URL. */
  action_url?: string;
};

export type BroadcastResult = {
  /** Active customers considered. */
  customers: number;
  /** Feed rows written — fewer than `customers` when some muted promotions. */
  in_app: number;
  /** Devices the push actually reached. */
  pushed: number;
  failed: number;
  /** Tokens FCM rejected as dead, cleared so they are not retried forever. */
  cleared_tokens: number;
  /** False when the server has no Firebase credential; in-app still works. */
  push_enabled: boolean;
};

export const announceApi = {
  send: (input: BroadcastInput) =>
    api.post<BroadcastResult>("/admin/notifications/broadcast", input),
};
