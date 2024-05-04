import { Message } from "discord.js";
import { deployCommands, undeployCommands } from "../deploy-commands";
export const once = false;
export const name = "messageCreate";

export async function execute(message: Message) {
    if (message.author.bot) return;
    if (message.content === "!!!give-me-a-favor-by-reloading-all-slash-commands-so-i-dont-have-to-reinvite-the-bot-again") {
        const guild = message.guild;
        if (!guild || message.author.id !== "466622123717296129") return;
        const msg = await message.reply("🔄 เคคับพรี่ รอผมแปป");
        await undeployCommands({ guildId: guild.id });
        await msg.edit("🔄 ลบคำสั่งเก่าเรียบร้อยแล้ว โหลดคำสั่งใหม่แปป");
        await deployCommands({ guildId: guild.id });
        await msg.edit("👍 โหลดคำสั่งใหม่เรียบร้อยแล้วครับพี่");
    }
}