import { AutocompleteInteraction, CommandInteraction, CommandInteractionOptionResolver, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { createColorRole, deleteColorRole, getColorRoles } from "../funcs/colorRole";

export const data = new SlashCommandBuilder()
    .setName("color")
    .setDescription("Setup color roles.")
    .addSubcommand(subcommand =>
        subcommand
        .setName("add")
            .setDescription("Add a color role.")
            .addStringOption(option =>
                option
                    .setName("name")
                    .setDescription("Name of the color role.")
                    .setRequired(true)
                )
            .addRoleOption(option =>
                option
                    .setName("role")
                    .setDescription("Role to assign.")
                    .setRequired(true)
            )
        )
    .addSubcommand(subcommand =>
        subcommand
            .setName("remove")
            .setDescription("Remove a color role.")
            .addStringOption(option =>
                option
                .setName("name")
                .setDescription("Name of the color role.")
                .setRequired(true)
                .setAutocomplete(true)
            )
        )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
export async function autocomplete(interaction: AutocompleteInteraction) {
    if (!interaction.guild) { return null; }
    const subcommand = interaction.options.getSubcommand();
    const focusedValue = interaction.options.getFocused();
    if (subcommand === "remove") {
        const colorRoles = await getColorRoles(interaction.guild);
        const options = colorRoles.map(role => {
            return {
                name: role.color,
                value: role.color
            }
        });
        return interaction.respond(options.filter(option => option.name.includes(focusedValue)).slice(0, 25));       
    }
}
export async function execute(interaction: CommandInteraction) {
    const subcommand = (interaction.options as CommandInteractionOptionResolver).getSubcommand();
    switch (subcommand) {
        case "add": {
            const name = (interaction.options as CommandInteractionOptionResolver).getString("name");
            const role = (interaction.options as CommandInteractionOptionResolver).getRole("role");
            if (!name || !role) { return interaction.reply("Invalid parameters."); }
            const guild = interaction.guild;
            if (!guild) { return interaction.reply("❌ This command must be run in a server."); }
            try {
                await createColorRole(guild, name, role.id);
            } catch (error) {
                console.error(error);
                return interaction.reply("⚠️ An error occurred while creating the role.");
            }
            return interaction.reply({ content: `Role created! 🎉 ${role} is now ${name}.`, ephemeral: true });
        }
        case "remove": {
            const name = (interaction.options as CommandInteractionOptionResolver).getString("name");
            if (!name) { return interaction.reply("Invalid parameters."); }
            const guild = interaction.guild;
            if (!guild) { return interaction.reply("❌ This command must be run in a server."); }
            try {
                await deleteColorRole(guild, name);
            } catch (error) {
                console.error(error);
                return interaction.reply("⚠️ An error occurred while deleting the role.");
            }
            return interaction.reply({ content: `Role deleted! 🎉 ${name} is no longer available.`, ephemeral: true });
        }
        default:
            return interaction.reply("Invalid subcommand.");
    }
}