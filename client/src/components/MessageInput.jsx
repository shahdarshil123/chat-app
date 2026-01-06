import { useState } from "react";
import { useAutoSuggest } from "../hooks/autoSuggest.js";

export default function MessageInput({ onSend, conversation = [] }) {
  const [value, setValue] = useState("");
  const [suppressSuggest, setSuppressSuggest] = useState(false);
  const [lastSuggestAt, setLastSuggestAt] = useState(0);
  
  const COOLDOWN_MS = 4000;
  const now = Date.now();
  const isCooldownActive = lastSuggestAt > 0 &&
  Date.now() - lastSuggestAt < COOLDOWN_MS;


  const suggestion = useAutoSuggest({
    input: value,
    conversation,
    disabled: suppressSuggest || isCooldownActive,
    onSuggest: ()=>{
      setLastSuggestAt(Date.now());
    }
  });

  function submit() {
    if (!value) return;
    onSend(value);
    setValue("");
  }

  function acceptSuggestion() {
    if (!suggestion) return;
    setValue(prev => prev + suggestion);
    setSuppressSuggest(true);
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
        onChange={e => {
          setValue(e.target.value);

          // any user typing resume autosuggest
          if(suppressSuggest){
            setSuppressSuggest(false);
          }
        }}
        onKeyDown={e => {
          if (e.key === "Tab" && suggestion) {
            e.preventDefault();
            acceptSuggestion();
            setSuppressSuggest(true);
            // setValue(value + suggestion);
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
