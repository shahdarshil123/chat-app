import { useMemo, useState } from "react";
import ConversationList from "./ConversationList";
import ConversationHeader from "./ConversationHeader";
import MessageFeed from "./MessageFeed";
import MessageInput from "./MessageInput";

const conversationsSeed = [
    {
        id: "1",
        title: "Project Channel",
        lastMessage: "Deployment completed",
        lastTime: "22:10",
        unread: 2,
        avatar: "PC",
    },
    {
        id: "2",
        title: "Team Discussion",
        lastMessage: "Please review the changes",
        lastTime: "18:45",
        unread: 0,
        avatar: "TD",
    },
    {
        id: "3",
        title: "General Chat",
        lastMessage: "Looks good to me",
        lastTime: "Yesterday",
        unread: 0,
        avatar: "GC",
    },
];

const messagesSeed = {
    "1": [
        { id: 1, fromSelf: false, text: "Deployment is done", time: "22:07" },
        { id: 2, fromSelf: true, text: "Great, I’ll verify logs", time: "22:08" },
    ],
    "2": [
        { id: 1, fromSelf: false, text: "Please review the changes", time: "18:45" },
    ],
    "3": [
        { id: 1, fromSelf: true, text: "Looks good to me", time: "Yesterday" },
    ],
};

export default function ChatLayout() {
    const [conversations, setConversations] = useState(conversationsSeed);
    const [activeId, setActiveId] = useState(conversationsSeed[0].id);
    const [search, setSearch] = useState("");
    const [messages, setMessages] = useState(messagesSeed);

    const activeConversation = useMemo(
        () => {
            conversations.find(c => c.id === activeId),
                [conversations, activeId];
        }
    );

    const filteredConversations = useMemo(() => {
        if (!search) return conversations;
        return conversations.filter(c =>
            c.title.toLowerCase().includes(search.toLowerCase())
        );
    }, [search, conversations]);

    function sendMessage(text) {
        if (!text.trim()) return;

        const time = new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });

        setMessages(prev => ({
            ...prev,
            [activeId]: [
                ...(prev[activeId] || []),
                { id: Date.now(), fromSelf: true, text, time },
            ],
        }));

        setConversations(prev =>
            prev.map(c =>
                c.id === activeId
                    ? { ...c, lastMessage: text, lastTime: time, unread: 0 }
                    : c
            )
        );
    }

    return (
        <div className="chat-app">
            <aside className="sidebar">
                <input
                    className="search"
                    placeholder="Search conversations"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />

                <ConversationList
                    conversations={filteredConversations}
                    activeId={activeId}
                    onSelect={setActiveId}
                />
            </aside>

            <section className="main">
                <ConversationHeader conversation={activeConversation} />
                <MessageFeed messages={messages[activeId] || []} />
                <MessageInput onSend={sendMessage} />
            </section>
        </div>
    );
}
