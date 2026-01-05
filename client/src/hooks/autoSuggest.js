import { useEffect, useRef, useState } from "react";
import { fetchAutoSuggestion } from "../api/ai.js";
import { shouldSuggest } from "./shouldSuggest.js";

export function useAutoSuggest({ input, conversation }) {
  const [suggestion, setSuggestion] = useState("");
  const abortRef = useRef(null);

  useEffect(() => {
    if (!shouldSuggest(input)) {
      setSuggestion("");
      return;
    }

    // cancel previous request
    if (abortRef.current) {
      abortRef.current.abort();
    }

    const controller = new AbortController();
    abortRef.current = controller;

    const timeout = setTimeout(async () => {
      try {
        const res = await fetchAutoSuggestion({
          input,
          conversation,
        });

        if (!controller.signal.aborted) {
          setSuggestion(res?.suggestion || "");
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Auto-suggest failed", err);
        }
      }
    }, 450); // 🔑 debounce

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [input, conversation]);

  console.log(suggestion);
  return suggestion;
}
