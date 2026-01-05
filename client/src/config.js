import { MESSAGE_API_VERSION_ENUM, USER_API_VERSION_ENUM, CONVERSATION_API_VERSION_ENUM, AUTH_API_VERSION_ENUM } from "./constants/apiVersions.js";

const msgVersion = import.meta.env.VITE_MESSAGE_API_VERSION;

export const MESSAGE_API_VERSION =
  msgVersion ?? MESSAGE_API_VERSION_ENUM.V2;

export const USER_API_VERSION =
  USER_API_VERSION_ENUM.V1;

export const CONVERSATION_API_VERSION =
  CONVERSATION_API_VERSION_ENUM.V1;

export const AUTH_API_VERSION =
  AUTH_API_VERSION_ENUM.V1;

// Optional but strongly recommended safety check
if (!Object.values(MESSAGE_API_VERSION_ENUM).includes(MESSAGE_API_VERSION)) {
  throw new Error(
    `Invalid VITE_MESSAGE_API_VERSION: ${MESSAGE_API_VERSION}`
  );
}
