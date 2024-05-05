import { Guild, GuildMember, StringSelectMenuInteraction } from "discord.js";
import prisma from "../db";

export async function createGameRole(guild: Guild, role: string, name: string) {
    try {
        await prisma.gameRole.upsert({
            where: {
                game: name,
            },
            update: {
                roleId: role,
            },
            create: {
                roleId: role,
                game: name,
                guild: {
                    connect: {
                        id: guild.id
                    }
                }
            }
        });
    } catch (error) {
        console.error(error);
    }
}

export async function deleteGameRole(guild: Guild, name: string) {
    try {
        await prisma.gameRole.delete({
            where: {
                game: name,
            }
        });
    } catch (error) {
        console.error(error);
    }
}

export async function getGameRole(guild: Guild, name: string) {
    return await prisma.gameRole.findFirst({
        where: {
            game: name,
            guildId: guild.id
        }
    });
}

export async function getGameRoles(guild: Guild) {
    return await prisma.gameRole.findMany({
        where: {
            guildId: guild.id
        }
    });
}

export async function setUserGameRole(user: GuildMember, roles: string[], interaction?: StringSelectMenuInteraction) {
    try {
        const gameRoles = await getGameRoles(user.guild);
        const userRoles = user.roles.cache.map(role => role.id);
        const rolesToAdd = roles.filter(role => !userRoles.includes(role));
        const rolesToRemove = gameRoles.filter(role => userRoles.includes(role.roleId) && !roles.includes(role.game));
        for (const role of rolesToRemove) {
            await user.roles.remove(role.roleId);
        }
        for (const role of rolesToAdd) {
            await user.roles.add(role);
        }
        if (interaction) {
            await interaction.followUp({ content: `✅ ตั้งค่าเกมสำเร็จ`, ephemeral: true });
        }
        console.log(`Game roles ${roles} assigned to ${user.user.tag}`);
    } catch (error) {
        console.error(error);
        if (interaction) {
            await interaction.followUp({ content: `⚠️ เกิดข้อผิดพลาดในขณะที่กำลังตั้งค่าเกม`, ephemeral: true });
        }
    }
}