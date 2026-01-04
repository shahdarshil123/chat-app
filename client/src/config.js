import { MESSAGE_API_VERSION_ENUM } from "./constants/apiVersions.js";

const envVersion = import.meta.env.VITE_MESSAGE_API_VERSION;

export const MESSAGE_API_VERSION =
  envVersion ?? MESSAGE_API_VERSION_ENUM.V2;

// Optional but strongly recommended safety check
if (!Object.values(MESSAGE_API_VERSION_ENUM).includes(MESSAGE_API_VERSION)) {
  throw new Error(
    `Invalid VITE_MESSAGE_API_VERSION: ${MESSAGE_API_VERSION}`
  );
}
