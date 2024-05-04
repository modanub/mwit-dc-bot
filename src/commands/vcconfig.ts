import { Channel, CommandInteraction, CommandInteractionOptionResolver, GuildChannel, GuildMember, PermissionsBitField, SlashCommandBuilder, VoiceChannel } from "discord.js";
import prisma from "../db";
import { getExistingVC, getVCConfig } from "../funcs/joinToCreateVC";

export const data = new SlashCommandBuilder()
  .setName("vcconfig")
  .setDescription("Configure private voice channel configuration.")
  .addSubcommandGroup(group =>
    group
      .setName("whitelist")
      .setDescription("Configure whitelist for private voice channel.")
      .addSubcommand(subcommand =>
        subcommand
          .setName("add")
          .setDescription("Add user to whitelist.")
          .addUserOption(option =>
            option
              .setName("user")
              .setDescription("User to whitelist.")
              .setRequired(true)
          )
      )
      .addSubcommand(subcommand =>
        subcommand
          .setName("remove")
          .setDescription("Remove user from whitelist.")
          .addUserOption(option =>
            option
              .setName("user")
              .setDescription("User to whitelist.")
              .setRequired(true)
          )
      )
  )
  .addSubcommandGroup(group =>
    group
      .setName("blacklist")
      .setDescription("Configure blacklist for private voice channel.")
      .addSubcommand(subcommand =>
        subcommand
          .setName("add")
          .setDescription("Add user to blacklist.")
          .addUserOption(option =>
            option
              .setName("user")
              .setDescription("User to blacklist.")
              .setRequired(true)
          )
      )
      .addSubcommand(subcommand =>
        subcommand
          .setName("remove")
          .setDescription("Remove user from blacklist.")
          .addUserOption(option =>
            option
              .setName("user")
              .setDescription("User to blacklist.")
              .setRequired(true)
          )
      )
  )
  .addSubcommandGroup(group =>
    group
      .setName("config")
      .setDescription("Configure private voice channel.")
      .addSubcommand(subcommand =>
        subcommand
          .setName("name")
          .setDescription("Set name of private voice channel.")
          .addStringOption(option =>
            option
              .setName("name")
              .setDescription("Name of private voice channel.")
              .setRequired(true)
          )
      )
        .addSubcommand(subcommand =>
          subcommand
            .setName("maxusers")
            .setDescription("Set maximum users in private voice channel.")
            .addIntegerOption(option =>
              option
                .setName("maxusers")
                .setDescription("Maximum users in private voice channel.")
                .setRequired(true)
          )
      )
        .addSubcommand(subcommand =>
          subcommand
            .setName("lock")
            .setDescription("Lock private voice channel.")
            .addBooleanOption(option =>
              option
                .setName("lock")
                .setDescription("Lock private voice channel. People in whitelist can still join.")
                .setRequired(true)
          )
      )
  )

async function updateList(type: "whitelist" | "blacklist", user: GuildMember, newData: string[]) {
  try {
    await prisma.voiceChannel.update({
      where: {
        id: user.id
      },
      data: {
        [type]: "[" + newData.join(", ") + "]"
      }
    });
  } catch (error) {
    console.error(error);
  }
}

export async function execute(interaction: CommandInteraction) {
  if (!interaction.guild) {
    await interaction.reply("This command can only be used in a server.");
    return;
  }
  const guildUser = interaction.member as GuildMember;
  const subcommandgroup = (interaction.options as CommandInteractionOptionResolver).getSubcommandGroup();
  const subcommand = (interaction.options as CommandInteractionOptionResolver).getSubcommand();
  const userVcConfig = await getVCConfig(guildUser.id, true);
  const existingVC = getExistingVC(guildUser, "⭐ " + (userVcConfig?.name || guildUser.displayName));

  if (!userVcConfig) {
    // should never happen
    await interaction.reply("Failed to load user voice channel configuration.");
    return;
  }
  const blacklist = userVcConfig.blacklist?.replace("[", "").replace("]", "").split(", ") || [] as string[]; // nig*** list
  const whitelist = userVcConfig.whitelist?.replace("[", "").replace("]", "").split(", ") || [] as string[];
  console.log(userVcConfig);
  switch (subcommandgroup) {
    case "whitelist": {
      const user = (interaction.options as CommandInteractionOptionResolver).getUser("user");
      if (!user) {
        await interaction.reply("User must be a valid user.");
        return;
      }
      if (subcommand === "add") {
        if (whitelist.find((e) => e == user.id)) {
          await interaction.reply("User " + user.displayName + " already added to whitelist")
          return;
        }
        whitelist.push(user.id);
        const index = blacklist.indexOf(user.id)
        if (index > -1) {
          blacklist.splice(index, 1);
          await updateList('whitelist', guildUser, blacklist);
        }
        await updateList('whitelist', guildUser, whitelist);
        await interaction.reply("Added user to whitelist." + (existingVC ? " Recreate voice channel to apply changes." : ""));
        return;
      } else if (subcommand === "remove") {
        const index = whitelist.indexOf(user.id);
        if (index > -1) {
          whitelist.splice(index, 1);
        } else {
          await interaction.reply("User is not in whitelist.");
          return;
        }
        await updateList('whitelist', guildUser, whitelist);
        await interaction.reply("Removed user from whitelist." + (existingVC ? " Recreate voice channel to apply changes." : ""));
        return;
      }
    }
    case "blacklist": {
      const user = (interaction.options as CommandInteractionOptionResolver).getUser("user");
      if (!user) {
        await interaction.reply("User must be a valid user.");
        return;
      }
      if (subcommand === "add") {
        if (blacklist.find((e) => e == user.id)) {
          await interaction.reply("User " + user.displayName + " already added to blacklist")
          return;
        }
        blacklist.push(user.id);
        const index = whitelist.indexOf(user.id);
        if (index > -1) {
          whitelist.splice(index, 1);
          await updateList('whitelist', guildUser, whitelist);
        }
        await updateList('blacklist', guildUser, blacklist);
        await interaction.reply("Added user to blacklist." + (existingVC ? " Recreate voice channel to apply changes." : ""));
        return;
      } else if (subcommand === "remove") {
        const index = blacklist.indexOf(user.id);
        if (index > -1) {
          blacklist.splice(index, 1);
        } else {
          await interaction.reply("User is not in blacklist.");
          return;
        }
        await updateList('blacklist', guildUser, blacklist);
        await interaction.reply("Removed user from blacklist." + (existingVC ? " Recreate voice channel to apply changes." : ""));
        return;
      }
    }
    case "config": {
      if (subcommand === "name") {
        try {
          const name = (interaction.options as CommandInteractionOptionResolver).getString("name");
          if (!name) {
            await interaction.reply("Name must be a valid string.");
            return;
          }
          if (name.length < 1 || name.length > 100) {
            await interaction.reply("Name must be between 1 and 100 characters.");
            return;
          }
          if (name == userVcConfig?.name) {
            await interaction.reply("Name is already set to that value.");
            return;
          }
          await prisma.voiceChannel.update({
            where: {
              id: userVcConfig.id
            },
            data: {
              name
            }
          });
          if (existingVC) {
            await (existingVC as GuildChannel).setName("⭐ " + name);
          }
          await interaction.reply("Set name of private voice channel.");
        } catch (error) {
          console.error(error);
          await interaction.reply("Failed to set name of private voice channel.");
          return;
        }
      } else if (subcommand === "maxusers") {
        try {
          const maxUsers = (interaction.options as CommandInteractionOptionResolver).getInteger("maxusers");
          if (!maxUsers || maxUsers < 0 || maxUsers > 99) {
            await interaction.reply("Maximum users must be a valid number between 0 and 99.");
            return;
          }
          if (maxUsers == userVcConfig?.maxUsers) {
            await interaction.reply("Maximum users is already set to that value.");
            return;
          }
          await prisma.voiceChannel.update({
            where: {
              id: userVcConfig.id
            },
            data: {
              maxUsers
            }
          });
          if (existingVC) {
            await (existingVC as VoiceChannel).setUserLimit(maxUsers);
          }
          await interaction.reply("Set maximum users to " + maxUsers + " in private voice channel.");
        } catch (error) {
          console.error(error);
          await interaction.reply("Failed to set maximum users in private voice channel.");
          return;
        }
      } else if (subcommand === "lock") {
        try {
          const lock = (interaction.options as CommandInteractionOptionResolver).getBoolean("lock");
          if (lock == !userVcConfig.public) {
            await interaction.reply("Private voice channel is already locked.");
            return;
          }
          await prisma.voiceChannel.update({
            where: {
              id: userVcConfig.id
            },
            data: {
              public: !lock
            }
          });
          if (existingVC) {
            await (existingVC as VoiceChannel).permissionOverwrites.edit(interaction.guild.roles.everyone, {
              Connect: !lock
            });
          }
          await interaction.reply("Locked private voice channel.");
        } catch (error) {
          console.error(error);
          await interaction.reply("Failed to lock private voice channel.");
          return;
        }
      }
    }
  }
}