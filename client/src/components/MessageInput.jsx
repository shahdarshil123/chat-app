import { useState } from "react";

export default function MessageInput({ onSend }) {
    const [value, setValue] = useState("");

    function submit() {
        onSend(value);
        setValue("");
    }

    return (
        <div className="input-bar">
            <input
                placeholder="Type a message"
                value={value}
                onChange={e => setValue(e.target.value)}
                onKeyDown={e => e.key === "Enter" && submit()}
            />
            <button onClick={submit}>Send</button>
        </div>
    );
}
