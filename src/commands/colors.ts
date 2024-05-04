import { APIActionRowComponent, APIMessageActionRowComponent, ActionRowBuilder, CommandInteraction, EmbedBuilder, SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "discord.js";
import { getColorRoles } from "../funcs/colorRole";

export const data = new SlashCommandBuilder()
  .setName("colors")
  .setDescription("Show all the colors.");

export async function execute(interaction: CommandInteraction) {
    if (!interaction.guild) { return interaction.reply("❌ This command must be run in a server."); }
    const colorRoles = await getColorRoles(interaction.guild);
    if (!colorRoles.length) { return interaction.reply("No color roles found."); }
    const embed = new EmbedBuilder()
        .setTitle("🎨 List of existing color roles")
        .setColor("#3D7AED");
    const desc = colorRoles.map(role => `- <@&${role.roleId}> - ${role.color}`).join("\n");
    embed.setDescription(desc);
    const menuSelector = new StringSelectMenuBuilder()
        .setCustomId("color_role_selector")
        .setPlaceholder("🎨 Select a color")
        .addOptions(colorRoles.map(role => {
            return new StringSelectMenuOptionBuilder()
                .setLabel(role.color)
                .setValue(role.roleId)
        }));
    const row = new ActionRowBuilder()
        .addComponents(menuSelector);
    await interaction.reply({ embeds: [embed], content: " ", components: [row as unknown as APIActionRowComponent<APIMessageActionRowComponent>], ephemeral: true});
}