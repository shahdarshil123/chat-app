import {openDB} from "idb";

const dbPromise = openDB("chat-db", 1, {
    upgrade(db){
        if(!db.objectStoreNames.contains("outbox")){
            db.createObjectStore("outbox", {keyPath: "id"});
        }
    },
});

export async function addToOutbox(message){
    const db = await dbPromise;
    await db.put("outbox", message);
}

export async function getOutboxMessages(){
    const db = await dbPromise;
    return await db.getAll("outbox");
}

export async function removeFromOutbox(id){
    const db = await dbPromise;
    await db.delete("outbox", id);
}