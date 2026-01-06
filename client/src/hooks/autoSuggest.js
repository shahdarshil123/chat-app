import { useEffect, useRef, useState } from "react";
import { fetchAutoSuggestion } from "../api/ai.js";
import { shouldSuggest } from "./shouldSuggest.js";

export function useAutoSuggest({ input, conversation, disabled, onSuggest }) {
  const [suggestion, setSuggestion] = useState("");
  const abortRef = useRef(null);
  const prevInputRef = useRef(input);

  useEffect(() => {
    if(prevInputRef.current !== input){
      setSuggestion("");
      prevInputRef.current = input;
    }

    if(disabled){
      return;
    }
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
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        const next = res?.suggestion || ""
        setSuggestion(next);

        if (next) onSuggest?.();

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
  }, [input, conversation, disabled]);

  console.log(suggestion);
  return suggestion;
}
