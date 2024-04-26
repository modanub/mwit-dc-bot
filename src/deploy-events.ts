import { Client } from "discord.js";
import { getEvents } from "./events";

export async function deployEvents(client: Client) {
    const events = await getEvents();
    for (const event of events) {
        if (event.once) {
            client.once(event.name as string, (...args) => event.execute(...args));
        } else {
            client.on(event.name as string, (...args) => event.execute(...args));
        }
    }
}