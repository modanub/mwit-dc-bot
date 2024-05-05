import { CommandInteraction, EmbedBuilder, GuildMember, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { deployCommands, undeployCommands } from "../deploy-commands";

export const data = new SlashCommandBuilder()
  .setName("refreshslashcommands")
  .setDescription("💬 รีเฟรชคำสั่งของบอท")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: CommandInteraction) {
    const msg = await interaction.reply("🔄 กำลังรีเฟรชคำสั่งของบอท...");
    const guild = interaction.guild;
    if (!guild || (interaction.member as GuildMember).id !== "466622123717296129") return;
    await msg.edit("🔄 เคคับพรี่ รอผมแปป");
    await undeployCommands({ guildId: guild.id });
    await msg.edit("🔄 ลบคำสั่งเก่าเรียบร้อยแล้ว โหลดคำสั่งใหม่แปป");
    await deployCommands({ guildId: guild.id });
    return await msg.edit("👍 โหลดคำสั่งใหม่เรียบร้อยแล้วครับพี่");
}