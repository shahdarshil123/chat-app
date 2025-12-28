import { useEffect, useRef } from "react";

export default function MessageFeed({ messages }) {
    const endRef = useRef(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <div className="messages">
            {messages.map(m => (
                <div
                    key={m.id}
                    className={`message-row ${m.fromSelf ? "self" : "other"}`}
                >
                    <div className="message">
                        <span>{m.text}</span>
                        <div className="time">{m.time}</div>
                    </div>
                </div>
            ))}
            <div ref={endRef} />
        </div>
    );
}
