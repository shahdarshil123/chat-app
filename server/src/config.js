import {
  MESSAGE_API_VERSION_ENUM,
  USER_API_VERSION_ENUM,
  CONVERSATION_API_VERSION_ENUM,
  AUTH_API_VERSION_ENUM,
} from "./constants/apiVersions.js";

/**
 * Default API versions (used for assumptions, logging, future redirects)
 * URLs are STILL versioned explicitly.
 */

export const DEFAULT_MESSAGE_API_VERSION =
  process.env.MESSAGE_API_VERSION ?? MESSAGE_API_VERSION_ENUM.V2;

export const DEFAULT_USER_API_VERSION =
  USER_API_VERSION_ENUM.V1;

export const DEFAULT_CONVERSATION_API_VERSION =
  CONVERSATION_API_VERSION_ENUM.V1;

export const DEFAULT_AUTH_API_VERSION =
  AUTH_API_VERSION_ENUM.V1;

/* --------------------------------------------------
   Safety checks (HIGHLY recommended)
-------------------------------------------------- */

function assertValid(value, enumObj, name) {
  if (!Object.values(enumObj).includes(value)) {
    throw new Error(`Invalid ${name}: ${value}`);
  }
}

assertValid(
  DEFAULT_MESSAGE_API_VERSION,
  MESSAGE_API_VERSION_ENUM,
  "DEFAULT_MESSAGE_API_VERSION"
);

assertValid(
  DEFAULT_USER_API_VERSION,
  USER_API_VERSION_ENUM,
  "DEFAULT_USER_API_VERSION"
);

assertValid(
  DEFAULT_CONVERSATION_API_VERSION,
  CONVERSATION_API_VERSION_ENUM,
  "DEFAULT_CONVERSATION_API_VERSION"
);

assertValid(
  DEFAULT_AUTH_API_VERSION,
  AUTH_API_VERSION_ENUM,
  "DEFAULT_AUTH_API_VERSION"
);
