import { APIActionRowComponent, APIMessageActionRowComponent, ActionRowBuilder, BaseGuildTextChannel, CommandInteraction, EmbedBuilder, SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "discord.js";
import { getColorRoles } from "../funcs/colorRole";

export const data = new SlashCommandBuilder()
    .setName("colors")
    .setDescription("🎨 แสดงรายชื่อสีชื่อและเมนูเลือกสี")
export async function execute(interaction: CommandInteraction) {
    if (!interaction.guild || interaction.channel?.isDMBased()) { return interaction.reply("❌ คำสั่งนี้ต้องใช้ในเซิร์ฟเวอร์เท่านั้น."); }
    const channel = interaction.channel as BaseGuildTextChannel;
    if (!channel.name?.toLowerCase().includes("commands") && !channel.name?.toLowerCase().includes("bot") && !channel.name?.toLowerCase().includes("spam")) {
        return interaction.reply({ content: "❌ ไม่สามารถใช้คำสั่งในช่องนี้!", ephemeral: true });
    }
    const colorRoles = await getColorRoles(interaction.guild);
    if (!colorRoles.length) { return interaction.reply("❓ ไม่มีสีใดๆ ในระบบ."); } 
    const embed = new EmbedBuilder()
        .setTitle("🎨 รายชื่อสีชื่อ")
        .setColor("#3D7AED");
    const desc = colorRoles.map(role => `- <@&${role.roleId}> - ${role.color}`).join("\n");
    embed.setDescription(desc);
    const menuSelector = new StringSelectMenuBuilder()
        .setCustomId("color_role_selector")
        .setPlaceholder("🎨 เลือกสีชื่อที่ต้องการ")
        .addOptions(colorRoles.map(role => {
            return new StringSelectMenuOptionBuilder()
                .setLabel(role.color)
                .setValue(role.roleId)
        }));
    const row = new ActionRowBuilder()
        .addComponents(menuSelector);
    await interaction.reply({ embeds: [embed], content: " ", components: [row as unknown as APIActionRowComponent<APIMessageActionRowComponent>], ephemeral: true});
}