import { Channel, CommandInteraction, CommandInteractionOptionResolver, GuildChannel, GuildMember, PermissionsBitField, SlashCommandBuilder, VoiceChannel } from "discord.js";
import prisma from "../db";
import { getExistingVC, getVCConfig, refreshChannelPermOverwrites } from "../funcs/joinToCreateVC";

export const data = new SlashCommandBuilder()
  .setName("vcconfig")
  .setDescription("⚙️ ตั้งค่าห้องเสียงส่วนตัว")
  .addSubcommandGroup(group =>
    group
      .setName("whitelist")
      .setDescription("⚙️ ตั้งค่าผู้ใช้ที่อนุญาตให้เข้าถึงห้องเสียงส่วนตัว")
      .addSubcommand(subcommand =>
        subcommand
          .setName("add")
          .setDescription("✅ เพิ่มผู้ใช้เข้าสู่รายชื่อที่อนุญาต")
          .addUserOption(option =>
            option
              .setName("user")
              .setDescription("🧑 ผู้ใช้ที่ต้องการเพิ่มในรายชื่อที่อนุญาต")
              .setRequired(true)
          )
      )
      .addSubcommand(subcommand =>
        subcommand
          .setName("remove")
          .setDescription("❌ ลบผู้ใช้ออกจากรายชื่อที่อนุญาต")
          .addUserOption(option =>
            option
              .setName("user")
              .setDescription("🧑 ผู้ใช้ที่ต้องการลบออกจากรายชื่อที่อนุญาต")
              .setRequired(true)
          )
      )
  )
  .addSubcommandGroup(group =>
    group
      .setName("blacklist")
      .setDescription("⚙️ ตั้งค่าผู้ใช้ที่ไม่อนุญาตให้เข้าถึงห้องเสียงส่วนตัว")
      .addSubcommand(subcommand =>
        subcommand
          .setName("add")
          .setDescription("✅ เพิ่มผู้ใช้เข้าสู่รายชื่อที่ไม่อนุญาต")
          .addUserOption(option =>
            option
              .setName("user")
              .setDescription("🧑 ผู้ใช้ที่ต้องการเพิ่มในรายชื่อที่ไม่อนุญาต")
              .setRequired(true)
          )
      )
      .addSubcommand(subcommand =>
        subcommand
          .setName("remove")
          .setDescription("❌ ลบผู้ใช้ออกจากรายชื่อที่ไม่อนุญาต")
          .addUserOption(option =>
            option
              .setName("user")
              .setDescription("🧑 ผู้ใช้ที่ต้องการลบออกจากรายชื่อที่ไม่อนุญาต")
              .setRequired(true)
          )
      )
  )
  .addSubcommandGroup(group =>
    group
      .setName("config")
      .setDescription("⚙️ ตั้งค่าห้องเสียงส่วนตัว")
      .addSubcommand(subcommand =>
        subcommand
          .setName("name")
          .setDescription("💬 ตั้งชื่อของห้องเสียงส่วนตัว")
          .addStringOption(option =>
            option
              .setName("name")
              .setDescription("🧾 ชื่อของห้องเสียงส่วนตัว")
              .setRequired(true)
          )
      )
        .addSubcommand(subcommand =>
          subcommand
            .setName("maxusers")
            .setDescription("👥 จำกัดจำนวนผู้ใช้ในห้องเสียงส่วนตัว")
            .addIntegerOption(option =>
              option
                .setName("maxusers")
                .setDescription("🫂 จำนวนสูงสุดของผู้ใช้ในห้องเสียงส่วนตัว")
                .setRequired(true)
          )
      )
        .addSubcommand(subcommand =>
          subcommand
            .setName("lock")
            .setDescription("🔒 ล็อคห้องเสียงส่วนตัว ผู้ใช้ในรายชื่อที่อนุญาตยังสามารถเข้าได้")
            .addBooleanOption(option =>
              option
                .setName("lock")
                .setDescription("🔑 สถานะการล็อคของห้องเสียงส่วนตัว")
                .setRequired(true)
          )
      )
    .addSubcommand(subcommand =>
      subcommand
          .setName("kick")
          .setDescription("👢 ลบผู้ใช้ออกจากห้องเสียงส่วนตัว")
          .addUserOption(option =>
              option
                  .setName("user")
                  .setDescription("🧑 ผู้ใช้ที่ต้องการลบออกจากห้องเสียงส่วนตัว")
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
    await interaction.reply("❌ คำสั่งนี้ต้องใช้ในเซิร์ฟเวอร์เท่านั้น.");
    return;
  }
  const guildUser = interaction.member as GuildMember;
  const subcommandgroup = (interaction.options as CommandInteractionOptionResolver).getSubcommandGroup();
  const subcommand = (interaction.options as CommandInteractionOptionResolver).getSubcommand();
  const userVcConfig = await getVCConfig(guildUser.id, true);
  const existingVC = getExistingVC(guildUser, "⭐ " + (userVcConfig?.name || guildUser.displayName));

  if (!userVcConfig) {
    // should never happen
    await interaction.reply("⚠️ ไม่พบการตั้งค่าห้องเสียงส่วนตัวสำหรับผู้ใช้นี้.");
    return;
  }
  if (subcommand === "kick") {
    if (!existingVC) { return await interaction.reply("❌ ไม่พบห้องเสียงส่วนตัวของคุณ"); }
    const user = (interaction.options as CommandInteractionOptionResolver).getUser("user");
    if (!user) { return await interaction.reply("❌ ไม่พบผู้ใช้"); }
    if (user.id == guildUser.id) { return await interaction.reply("❌ คุณไม่สามารถลบตัวเองออกจากห้องเสียงส่วนตัวได้"); }
    const member = await interaction.guild.members.fetch(user.id);
    if (!member) { return await interaction.reply("❌ ไม่พบผู้ใช้"); }
    if (userVcConfig.id != guildUser.id) { return await interaction.reply("❌ คุณไม่ใช่เจ้าของของห้องเสียงส่วนตัว"); }
    if (member.voice.channelId != (existingVC as VoiceChannel).id) { return await interaction.reply("❌ ผู้ใช้ไม่ได้อยู่ในห้องเสียงส่วนตัวของคุณ"); }
    await member.voice.disconnect();
    return await interaction.reply("✅ ลบผู้ใช้ออกจากห้องเสียงส่วนตัวเสร็จสิ้น");
  }
    
  const blacklist = userVcConfig.blacklist?.replace("[", "").replace("]", "").split(", ") || [] as string[]; // nig*** list
  const whitelist = userVcConfig.whitelist?.replace("[", "").replace("]", "").split(", ") || [] as string[];
  console.log(userVcConfig);
  switch (subcommandgroup) {
    case "whitelist": {
      const user = (interaction.options as CommandInteractionOptionResolver).getUser("user");
      if (!user) {
        await interaction.reply("❌ ไม่พบผู้ใช้")
        return;
      }
      if (subcommand === "add") {
        if (whitelist.find((e) => e == user.id)) {
          await interaction.reply("⚠️ ผู้ใช้ดังกล่าวอยู่ในรายชื่อที่ได้รับอนุญาตอยู่แล้ว")
          return;
        }
        whitelist.push(user.id);
        const index = blacklist.indexOf(user.id)
        if (index > -1) {
          blacklist.splice(index, 1);
          await updateList('whitelist', guildUser, blacklist);
        }
        await updateList('whitelist', guildUser, whitelist);
        if (existingVC) await refreshChannelPermOverwrites(existingVC as VoiceChannel, guildUser);
        await interaction.reply("✅ เพิ่มผู้ใช้ลงในรายชื่อที่อนุญาตเสร็จสิ้น");
        return;
      } else if (subcommand === "remove") {
        const index = whitelist.indexOf(user.id);
        if (index > -1) {
          whitelist.splice(index, 1);
        } else {
          await interaction.reply("❌ ผู้ใช้ไม่ได้อยู่ในรายชื่อที่ได้รับอนุญาต");
          return;
        }
        await updateList('whitelist', guildUser, whitelist);
        if (existingVC) await refreshChannelPermOverwrites(existingVC as VoiceChannel, guildUser);
        await interaction.reply("✅ ลบผู้ใช้ออกจากรายชื่อที่อนุญาตเสร็จสิ้น");
        return;
      }
    }
    case "blacklist": {
      const user = (interaction.options as CommandInteractionOptionResolver).getUser("user");
      if (!user) {
        await interaction.reply("❌ ไม่พบผู้ใช้")
        return;
      }
      if (subcommand === "add") {
        if (blacklist.find((e) => e == user.id)) {
          await interaction.reply("⚠️ ผู้ใช้ดังกล่าวอยู่ในรายชื่อที่ไม่ได้รับอนุญาตอยู่แล้ว")
          return;
        }
        blacklist.push(user.id);
        const index = whitelist.indexOf(user.id);
        if (index > -1) {
          whitelist.splice(index, 1);
          await updateList('whitelist', guildUser, whitelist);
        }
        await updateList('blacklist', guildUser, blacklist);
        if (existingVC) await refreshChannelPermOverwrites(existingVC as VoiceChannel, guildUser);
        await interaction.reply("✅ เพิ่มผู้ใช้ลงในรายชื่อที่ไม่อนุญาตเสร็จสิ้น");
        return;
      } else if (subcommand === "remove") {
        const index = blacklist.indexOf(user.id);
        if (index > -1) {
          blacklist.splice(index, 1);
        } else {
          await interaction.reply("❌ ผู้ใช้ไม่ได้อยู่ในรายชื่อที่ไม่ได้รับอนุญาต");
          return;
        }
        await updateList('blacklist', guildUser, blacklist);
        if (existingVC) await refreshChannelPermOverwrites(existingVC as VoiceChannel, guildUser);
        await interaction.reply("✅ ลบผู้ใช้ออกจากรายชื่อที่ไม่อนุญาตเสร็จสิ้น");
        return;
      }
    }
    case "config": {
      if (subcommand === "name") {
        try {
          const name = (interaction.options as CommandInteractionOptionResolver).getString("name");
          if (!name) {
            await interaction.reply("❌ กรุณาใส่ชื่อ");
            return;
          }
          if (name.length < 1 || name.length > 100) {
            await interaction.reply("❌ ชื่อต้องมีความยาวระหว่าง 1 ถึง 100 ตัวอักษร");
            return;
          }
          if (name == userVcConfig?.name) {
            await interaction.reply("❓ ชื่อห้องเสียงส่วนตัวถูกตั้งเป็น " + name + " อยู่แล้ว");
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
          await interaction.reply("✅ ตั้งชื่อห้องเสียงส่วนตัวเป็น " + name + " เสร็จสิ้น");
        } catch (error) {
          console.error(error);
          await interaction.reply("❌ ไม่สามารถตั้งชื่อห้องเสียงส่วนตัวได้");
          return;
        }
      } else if (subcommand === "maxusers") {
        try {
          const maxUsers = (interaction.options as CommandInteractionOptionResolver).getInteger("maxusers");
          if (!maxUsers || maxUsers < 0 || maxUsers > 99) {
            await interaction.reply("❌ จำนวนผู้ใช้ต้องอยู่ระหว่าง 0 ถึง 99");
            return;
          }
          if (maxUsers == userVcConfig?.maxUsers) {
            await interaction.reply("❓ จำนวนผู้ใช้ในห้องเสียงส่วนตัวถูกตั้งเป็น " + maxUsers + " อยู่แล้ว");
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
          await interaction.reply("✅ ตั้งจำนวนผู้ใช้ในห้องเสียงส่วนตัวเป็น " + maxUsers + " เสร็จสิ้น");
        } catch (error) {
          console.error(error);
          await interaction.reply("❌ ไม่สามารถตั้งจำนวนผู้ใช้ในห้องเสียงส่วนตัวได้");
          return;
        }
      } else if (subcommand === "lock") {
        try {
          const lock = (interaction.options as CommandInteractionOptionResolver).getBoolean("lock");
          if (lock == !userVcConfig.public) {
            await interaction.reply("❓ สถานะการล็อคของห้องเสียงส่วนตัวถูกตั้งเป็น " + (lock ? "ล็อค" : "ปลดล็อค") + " อยู่แล้ว");
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
          await interaction.reply("✅ ตั้งสถานะการล็อคของห้องเสียงส่วนตัวเป็น " + (lock ? "ล็อค" : "ปลดล็อค") + " เสร็จสิ้น");
        } catch (error) {
          console.error(error);
          await interaction.reply("❌ ไม่สามารถตั้งสถานะการล็อคของห้องเสียงส่วนตัวได้");
          return;
        }
      }
    }
  }
}