import { SlashCommandBuilder } from "discord.js";
import fs from "fs";

const files = fs.readdirSync(__dirname);

let init = false;
let commands: { data: SlashCommandBuilder, execute: (interaction: any) => void, autocomplete?: (interaction: any) => void }[] = [];

async function load() {
    for (const file of files) {
        if (file === "index.ts") continue;
        try {
            const command = await import("./" + file.replace(".ts", ""));
            console.log(`Loaded command: ${command.data.name}`);
            commands.push(command);
        } catch (error) {
            console.error(`Failed to load command: ${file}`);
            console.error(error);
        }
    }
}

export async function getCommands() {
    if (!init) {
        await load();
        init = true;
    }
    return commands;
}