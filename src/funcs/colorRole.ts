import { ButtonInteraction, CommandInteraction, Guild, GuildMember, Interaction, StringSelectMenuInteraction } from "discord.js";
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
    if (user.roles.cache.some(r => r.id === role)) {
        if (interaction) {
            await interaction.reply({ content: `❌ You already have the color role <@&${role}>.`, ephemeral: true });
        }
        return;
    }
    try {
        await removeAllColorFromUser(user);
        user.roles.add(role);
        console.log(`Color role ${role} added to user ${user.id}`);
        if (interaction) await interaction.reply({ content: `✅ Equipped color role <@&${role}>.`, ephemeral: true });
    } catch (error) {
        console.error(error);
    }
}