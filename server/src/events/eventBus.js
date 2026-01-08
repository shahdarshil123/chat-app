const handlers = new Map();

export function on(eventName, handler) {
  console.log(`🧩 Registering handler for event: ${eventName}`);

  if (!handlers.has(eventName)) {
    handlers.set(eventName, []);
  }
  handlers.get(eventName).push(handler);
}

export function emit(eventName, payload) {
  const eventHandlers = handlers.get(eventName) || [];

  console.log(
    `📣 Emitting event "${eventName}" to ${eventHandlers.length} handlers`
  );

  for (const handler of eventHandlers) {
    Promise.resolve().then(() => handler(payload));
  }
}