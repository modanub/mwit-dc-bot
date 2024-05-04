import { APIActionRowComponent, APIMessageActionRowComponent, ActionRowBuilder, AutocompleteInteraction, CommandInteraction, CommandInteractionOptionResolver, EmbedBuilder, GuildMember, PermissionFlagsBits, SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "discord.js";
import { createGameRole, deleteGameRole, getGameRole, getGameRoles } from "../funcs/gameRole";

export const data = new SlashCommandBuilder()
    .setName("game")
    .setDescription("Game color roles.")
    .addSubcommand(subcommand =>
        subcommand
            .setName("add")
            .setDescription("Add a game role. (Admin only)")
            .addStringOption(option =>
                option
                    .setName("name")
                    .setDescription("Name of the game role.")
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
            .setDescription("Remove a game role. (Admin only)")
            .addStringOption(option =>
                option
                .setName("name")
                .setDescription("Name of the game role.")
                .setRequired(true)
                .setAutocomplete(true)
            )
        )
    .addSubcommand(subcommand =>
        subcommand
            .setName("list")
            .setDescription("List game roles.")
        )
    .addSubcommand(subcommand =>
        subcommand
            .setName("join")
            .setDescription("Join a game role.")
            .addStringOption(option =>
                option
                .setName("name")
                .setDescription("Name of the game role.")
                .setRequired(true)
                .setAutocomplete(true)
            )
        )
    .addSubcommand(subcommand =>
        subcommand
            .setName("leave")
            .setDescription("Leave a game role.")
            .addStringOption(option =>
                option
                .setName("name")
                .setDescription("Name of the game role.")
                .setRequired(true)
                .setAutocomplete(true)
            )
        );
export async function autocomplete(interaction: AutocompleteInteraction) {
    if (!interaction.guild) { return null; }
    const subcommand = interaction.options.getSubcommand();
    const focusedValue = interaction.options.getFocused();
    if (subcommand === "remove" || subcommand === "join" || subcommand === "leave") {
        const gameRoles = await getGameRoles(interaction.guild);
        const options = gameRoles.map(role => {
            return {
                name: role.game,
                value: role.game
            }
        });
        return interaction.respond(options.filter(option => option.name.includes(focusedValue)).slice(0, 25));      
    }
}
export async function execute(interaction: CommandInteraction) {
    if (!interaction.guild) { return interaction.reply("❌ This command must be run in a server."); }
    const subcommand = (interaction.options as CommandInteractionOptionResolver).getSubcommand();
    switch (subcommand) {
        case "add": {
            const name = (interaction.options as CommandInteractionOptionResolver).getString("name");
            const role = (interaction.options as CommandInteractionOptionResolver).getRole("role");
            if (!name || !role) { return interaction.reply("Invalid parameters."); }
            try {
                await createGameRole(interaction.guild, role.id, name);
                return interaction.reply(`Game role ${name} created.`);
            } catch (error) {
                console.error(error);
                return interaction.reply("⚠️ An error occurred while creating the game role.");
            }
        }
        case "remove": {
            const name = (interaction.options as CommandInteractionOptionResolver).getString("name");
            if (!name) { return interaction.reply("Invalid parameters."); }
            try {
                await deleteGameRole(interaction.guild, name);
                return interaction.reply(`Game role ${name} deleted.`);
            } catch (error) {
                console.error(error);
                return interaction.reply("⚠️ An error occurred while deleting the game role.");
            }
        }
        case "list": {
            const gameRoles = await getGameRoles(interaction.guild);
            if (gameRoles.length === 0) { return interaction.reply("No game roles found."); }
            const embed = new EmbedBuilder()
                .setTitle("🎮 Game Roles")
                .setColor("#ED9A3D")
                .setDescription(gameRoles.map(role => `- <@&${role.roleId}> - ${role.game}`).join("\n"));
            return interaction.reply({ embeds: [embed] });
        }
        case "join": {
            const name = (interaction.options as CommandInteractionOptionResolver).getString("name");
            if (!name) { return interaction.reply("Invalid parameters."); }
            const gameRole = await getGameRole(interaction.guild, name);
            if (!gameRole) { return interaction.reply("Game role not found."); }
            const member = interaction.member as GuildMember;
            if (!member) { return interaction.reply("❌ This command must be run by a member."); }
            if (member.roles.cache.has(gameRole.roleId)) { return interaction.reply("You already have this role."); }
            try {
                await member.roles.add(gameRole.roleId);
                return interaction.reply(`Joined game role ${name}.`);
            } catch (error) {
                console.error(error);
                return interaction.reply("⚠️ An error occurred while joining the game role.");
            }
        }
        case "leave": {
            const name = (interaction.options as CommandInteractionOptionResolver).getString("name");
            if (!name) { return interaction.reply("Invalid parameters."); }
            const gameRole = await getGameRole(interaction.guild, name);
            if (!gameRole) { return interaction.reply("Game role not found."); }
            const member = interaction.member as GuildMember;
            if (!member) { return interaction.reply("❌ This command must be run by a member."); }
            if (!member.roles.cache.has(gameRole.roleId)) { return interaction.reply("You don't have this role."); }
            try {
                await member.roles.remove(gameRole.roleId);
                return interaction.reply(`Left game role ${name}.`);
            } catch (error) {
                console.error(error);
                return interaction.reply("⚠️ An error occurred while leaving the game role. Maybe I don't have permission to manage roles or the role is higher than mine.");
            }
        }
    }
}