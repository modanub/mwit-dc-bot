import { SlashCommandBuilder } from "discord.js";
import fs from "fs";

let init = false;
let commands: { data: SlashCommandBuilder, execute: (interaction: any) => void, autocomplete?: (interaction: any) => void }[] = [];

async function loadsubdirRecursive(path: string) {
    const files = fs.readdirSync(path);
    for (const file of files) {
        if (file === "index.ts") continue;
        if (fs.lstatSync(path + "/" + file).isDirectory()) {
            console.log(`Loading commands in subdirectory: ${file}`);
            await loadsubdirRecursive(path + "/" + file);
        }
        try {
            const command = await import("./" + (path.split('/')[1] ? (path.split('/')[1] + "/") : ("")) + file.replace(".ts", ""));
            console.log(`Loaded command: ${command.data.name}`);
            commands.push(command);
        } catch (error) {
            console.error(`Failed to load command: ${file}`);
        }
    }
}

async function load() {
    // for (const file of files) {
    //     if (file === "index.ts") continue;
    //     if (fs.lstatSync(__dirname + "/" + file).isDirectory()) {
    //         // load commands in subdirectories

    //     }
    //     try {
    //         const command = await import("./" + file.replace(".ts", ""));
    //         console.log(`Loaded command: ${command.data.name}`);
    //         commands.push(command);
    //     } catch (error) {
    //         console.error(`Failed to load command: ${file}`);
    //         console.error(error);
    //     }
    // }
    await loadsubdirRecursive(__dirname);
}

export async function getCommands() {
    if (!init) {
        await load();
        init = true;
    }
    return commands;
}