import { PermissionFlagsBits, CommandInteraction, SlashCommandBuilder, ChannelType } from "discord.js";
import prisma from "../db";

export const data = new SlashCommandBuilder()
    .setName("setupjoinvc")
    .setDescription("Initialize parameters for \"Join to Create VC\" feature.")
    .addChannelOption(option => option
        .setName("category")
        .setDescription("Category where the voice channels will be created.")
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildCategory)
    )
    .addChannelOption(option => option
        .setName("join-to-create-channel")
        .setDescription("Text channel where the users will join to create a voice channel.")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: CommandInteraction) {
    const guildId = interaction.guildId;
    if (!guildId) { return interaction.reply("❌ This command must be run in a server."); }
    const category = interaction.options.get("category");
    const joinToCreateChannel = interaction.options.get("join-to-create-channel");
    if (!category || !joinToCreateChannel) { return interaction.reply("Invalid parameters."); }
    try {
        await prisma.guild.upsert({
            where: {
                id: guildId
            },
            update: {
                categoryId: category.value as string,
                joinToCreateChannel: joinToCreateChannel.value as string
            },
            create: {
                id: guildId,
                categoryId: category.value as string,
                joinToCreateChannel: joinToCreateChannel.value as string
            }
        });
    } catch (error) {
        console.error(error);
        return interaction.reply("⚠️ An error occurred while setting up the parameters.");
    }
    await interaction.reply("Setup complete! 🎉");
}