import { MESSAGE_API_VERSION_ENUM } from "../constants/apiVersions";
import { createMessageStrategyV1 } from "./messageStrategy.v1";
import { createMessageStrategyV2 } from "./messageStrategy.v2";

export function createMessageStrategy({
  version,
  fetchMessages,
}) {
  switch (version) {
    case MESSAGE_API_VERSION_ENUM.V1:
      return createMessageStrategyV1(fetchMessages);

    case MESSAGE_API_VERSION_ENUM.V2:
      return createMessageStrategyV2(fetchMessages);

    default:
      throw new Error(`Unsupported message API version: ${version}`);
  }
}
