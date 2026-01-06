export async function fetchAutoSuggestion({ input, conversation, signal }) {
    const res = await fetch("http://localhost:4000/api/v1/ai/auto-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ input, conversation }),
        signal,
    });

    if (!res.ok) return null;
    return res.json();
}
