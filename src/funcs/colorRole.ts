import { APIActionRowComponent, APIMessageActionRowComponent, ActionRowBuilder, ButtonInteraction, CommandInteraction, EmbedBuilder, Guild, GuildMember, Interaction, StringSelectMenuBuilder, StringSelectMenuInteraction, StringSelectMenuOptionBuilder } from "discord.js";
import prisma from "../db";

export async function createColorRole(guild: Guild, name: string, roleId: string) {
    try {
        await prisma.colorRole.upsert({
            where: {
                color: name,
            },
            update: {
                roleId: roleId,
            },
            create: {
                roleId: roleId,
                color: name,
                guild: {
                    connect: {
                        id: guild.id
                    }
                }
            }
        });
        console.log(`Color role ${name} created for guild ${guild.id}`);    
    } catch (error) {
        console.error(error);
    }
}

export async function deleteColorRole(guild: Guild, name: string) {
    try {
        await prisma.colorRole.delete({
            where: {
                color: name,
            }
        });
        console.log(`Color role ${name} deleted for guild ${guild.id}`);
    } catch (error) {
        console.error(error);
    }
}

export async function getColorRole(guild: Guild, name: string) {
    return await prisma.colorRole.findFirst({
        where: {
            color: name,
            guildId: guild.id
        }
    });
}

export async function getColorRoles(guild: Guild) {
    return await prisma.colorRole.findMany({
        where: {
            guildId: guild.id
        }
    });
}

async function removeAllColorFromUser(user: GuildMember) {
    const colorRoles = await getColorRoles(user.guild);
    await user.roles.cache.forEach(async (role) => {
        const colorRole = colorRoles.find(colorRole => colorRole.roleId == role.id);
        if (colorRole) {
            await user.roles.remove(role);
        }
    });
}

export async function setUserColorRole(user: GuildMember, role: string, interaction?: StringSelectMenuInteraction) {
    await interaction?.deferUpdate();
    if (user.roles.cache.some(r => r.id === role)) {
        if (interaction) {
            await interaction.followUp({ content: `❌ ตุณมีสีนี้อยู่แล้ว`, ephemeral: true });
        }
        return;
    }
    try {
        await removeAllColorFromUser(user);
        user.roles.add(role);
        console.log(`Color role ${role} added to user ${user.id}`);
        if (interaction) await interaction.followUp({ content: `✅ การตั้งค่าสีชื่อ <@&${role}> สำเร็จ`, ephemeral: true })
    } catch (error) {
        console.error(error);
    }
}

export async function clHandleButtonInteraction(interaction: ButtonInteraction) {
    await interaction.deferUpdate();
      if (!interaction.guild || interaction.channel?.isDMBased()) { await interaction.followUp("❌ คำสั่งนี้ต้องใช้ในเซิร์ฟเวอร์เท่านั้น."); return }
      const colorRoles = await getColorRoles(interaction.guild);
      if (!colorRoles.length) { await interaction.followUp("❓ ไม่มีสีใดๆ ในระบบ"); return } 
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
                  .setDefault((interaction.member as GuildMember).roles.cache.has(role.roleId))
          }));
      const row = new ActionRowBuilder()
          .addComponents(menuSelector);
      await interaction.followUp({ embeds: [embed], content: " ", components: [row as unknown as APIActionRowComponent<APIMessageActionRowComponent>], ephemeral: true});
      return;
}