import { Events } from "discord.js";
import fs from "fs";

const files = fs.readdirSync(__dirname);

let init = false;
let events: { name: Events, once: boolean, execute: (...args: any[]) => void }[] = [];
async function load() {
    for (const file of files) {
        if (file === "index.ts") continue;
        const event = await import("./" + file.replace(".ts", ""));
        console.log(`Loaded event: ${event.name}`);
        events.push(event);
    }
}

export async function getEvents() {
    if (!init) {
        await load();
        init = true;
    }
    return events;
}