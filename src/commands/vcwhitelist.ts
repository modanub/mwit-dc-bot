import { CommandInteraction, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
    .setName("vcconfig")
    .setDescription("Configure private voice channel configuration.")
    .addStringOption(option => option
        .setName("name")
        .setDescription("Name of the voice channel.")
        .setRequired(true)
    )
    ;

export async function execute(interaction: CommandInteraction) {
  return interaction.reply("Pong!");
}