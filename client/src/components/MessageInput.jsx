import { useState } from "react";
import { useAutoSuggest } from "../hooks/autoSuggest.js";

export default function MessageInput({ onSend, conversation = [] }) {
  const [value, setValue] = useState("");

  const suggestion = useAutoSuggest({
    input: value,
    conversation,
  });

  function submit() {
    if (!value) return;
    onSend(value);
    setValue("");
  }

  function acceptSuggestion() {
    if (!suggestion) return;
    setValue(value + suggestion);
  }

  return (
    <div className="input-bar">
  <div className="input-wrapper">
    <div className="input-clip">
      {value && (
        <div className="ghost-input">
          <span className="typed">{value}</span>
          <span className="ghost">{suggestion}</span>
        </div>
      )}
      <input
        placeholder="Type a message"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Tab" && suggestion) {
            e.preventDefault();
            setValue(value + suggestion);
          }
          if (e.key === "Enter") {
            submit();
          }
        }}
      />
    </div>
  </div>

  <button onClick={submit}>Send</button>
</div>
  );
}
