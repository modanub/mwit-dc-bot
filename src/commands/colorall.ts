import { AutocompleteInteraction, CommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { getColorRoles } from "../funcs/colorRole";

export const data = new SlashCommandBuilder()
    .setName("colorall")
    .setDescription("Set everyone's color to a specific color. [50 people at a time]") // prevent rate limit
    .addStringOption(option =>
        option
        .setName("color")
        .setDescription("Color to set.")
        .setRequired(true)
        .setAutocomplete(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
export async function autocomplete(interaction: AutocompleteInteraction) {
    if (!interaction.guild) { return null; }
    const focusedValue = interaction.options.getFocused();
    const colorRoles = await getColorRoles(interaction.guild);
    const options = colorRoles.map(role => {
        return {
            name: role.color,
            value: role.color
        }
    });
    return interaction.respond(options.filter(option => option.name.includes(focusedValue)).slice(0, 25));       
}
export async function execute(interaction: CommandInteraction) {
    const color = interaction.options.get("color");
    if (!color) { return interaction.reply("Invalid parameters."); }
    const guild = interaction.guild;
    if (!guild) { return interaction.reply("❌ This command must be run in a server."); }
    await interaction.deferReply();
    let members
    try {
        members = await guild.members.fetch();
    } catch (error) {
        console.error(error);
        return await interaction.followUp("⚠️ An error occurred while fetching the members.");
    }
    const colorRoles = await getColorRoles(guild);
    const colorRole = colorRoles.find(role => role.color === color.value);
    if (!colorRole) { return interaction.reply("Color role not found."); }
    let count = 0;
    console.log(`Assigning color role ${colorRole.color} to ${members.size} members.`)
    for (const member of members.values()) {
        if (count >= 50) { break; }
        if (member.user.bot) { continue; }
        if (member.roles.cache.has(colorRole.roleId)) {
            console.log(`Color role ${colorRole.color} already assigned to ${member.user.tag}`);
            continue;
        }
        try {
            await member.roles.add(colorRole.roleId);
            console.log(`Color role ${colorRole.color} assigned to ${member.user.tag}`);
        } catch (error) {
            console.error(error);
            return await interaction.followUp("⚠️ An error occurred while assigning the color role.");
        }
        count++;
    }
    await interaction.followUp(`Assigned color role ${colorRole.color} to ${count} members.`);
}