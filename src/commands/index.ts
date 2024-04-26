import { SlashCommandBuilder } from "discord.js";
import fs from "fs";

const files = fs.readdirSync(__dirname);

let init = false;
let commands: { data: SlashCommandBuilder, execute: (interaction: any) => void }[] = [];

async function load() {
    for (const file of files) {
        if (file === "index.ts") continue;
        const command = await import("./" + file.replace(".ts", ""));
        console.log(`Loaded command: ${command.data.name}`);
        commands.push(command);
    }
}

export async function getCommands() {
    if (!init) {
        await load();
        init = true;
    }
    return commands;
}