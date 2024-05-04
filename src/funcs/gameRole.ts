import { Guild, GuildMember } from "discord.js";
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