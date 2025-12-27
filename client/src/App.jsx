import { useEffect, useState } from "react";
import { socket } from "./socket";

const CONVERSATION_ID = "demo-room";
const USER_ID = crypto.randomUUID();

export default function App() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    // log client connection
    socket.on("connect", () => {
      console.log("CLIENT CONNECTED", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.error("SOCKET ERROR", err);
    });

    // join conversation room
    socket.emit("conversation:join", CONVERSATION_ID);

    // receive messages
    socket.on("message:new", (msg) => {
      setMessages((prev) => [...prev, msg]);
      console.log(msg);
      console.log(messages);
    });

    return () => {
      socket.off("connect");
      socket.off("connect_error");
      socket.off("message:new");
    };
  }, []);

  const sendMessage = () => {
    if (!text.trim()) return;

    socket.emit("message:send", {
      conversationId: CONVERSATION_ID,
      senderId: USER_ID,
      text
    });

    setText("");
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>💬 Chat Demo</h2>

      <div style={{ marginBottom: 12 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type message…"
          style={{ marginRight: 6 }}
        />
        <button onClick={sendMessage}>Send</button>
      </div>

      <ul>
        {messages.map((m) => (
          <li key={m.id}>
            <b>{m.senderId.slice(0, 6)}:</b> {m.text}
          </li>
        ))}
      </ul>
    </div>
  );
}
