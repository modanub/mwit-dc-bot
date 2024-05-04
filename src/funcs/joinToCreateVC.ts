import { Guild, VoiceChannel } from "@prisma/client";
import prisma from "../db";
import { Channel, ChannelType, GuildMember, GuildVoiceChannelResolvable, OverwriteResolvable } from "discord.js";
import { client } from "..";

export async function getVCConfig(userId: string, createIfNull: boolean = false): Promise<VoiceChannel | null> {
    try {
        return createIfNull ? await prisma.voiceChannel.upsert({
            where: {
                id: userId
            },
            update: {},
            create: {
                id: userId,
                maxUsers: 0,
                guild: {
                    connect: {
                        id: client.guilds.cache.first()?.id
                    }
                }
            }
        }) : await prisma.voiceChannel.findFirst({
            where: {
                id: userId
            }
        });
    } catch (error) {
        console.error(error);
        return null;
    }
}

export async function getGuildConfig(guildId: string): Promise<Guild | null> {
    return await prisma.guild.findFirst({
      where: {
        id: guildId
      }
    })
}

export function getExistingVC(user: GuildMember, name: string): GuildVoiceChannelResolvable | undefined {
    name = name == "NaN" ? user.displayName : name;
    return user.guild.channels.cache.find(channel => channel.type === ChannelType.GuildVoice && channel.name === name) as GuildVoiceChannelResolvable;
}

export async function createVC(guildId: string, guildConfig: Guild, user: GuildMember) {
    if (!guildConfig) {
        console.error("Guild config not found for guild ID " + guildId);
        return;
    }
    const userConfig = await getVCConfig(user.id);
    if (!userConfig) {
        console.warn("Using default values for user ID " + user.id);
    }
    const channelName = "⭐ " + (userConfig && userConfig.name != "NaN" ? userConfig.name : user.displayName);
    const existingVC = getExistingVC(user, channelName);
    if (existingVC) {
        console.warn("Channel already exists for user ID " + user.id);
        await user.voice.setChannel(existingVC);
        return;
    }
    let blacklist: OverwriteResolvable[] = [];
    let whitelist: OverwriteResolvable[] = [];
    try {
        for (const userId of userConfig?.whitelist?.replace("[", "").replace("]", "").split(", ") || [] as string[]) {
            if (userId === user.id) continue;
            if (userId === "") continue;
            console.debug("Whitelisting user ID " + userId + " for user ID " + user.id);
            whitelist.push({
                id: userId,
                allow: ["ViewChannel", "Connect", "Speak", "Stream"]
            });
        }
        for (const userId of userConfig?.blacklist?.replace("[", "").replace("]", "").split(", ") || [] as string[]) {
            if (userId === user.id) continue;
            if (userId === "") continue;
            console.debug("Blacklisting user ID " + userId + " for user ID " + user.id);
            blacklist.push({
                id: userId,
                deny: ["Connect"],
                allow: ["ViewChannel"]
            });
        }
    } catch (error) {
        console.log("An error occurred while processing whitelist/blacklist");
        console.error(error);
    }
    try {
        const channel = await user.guild.channels.create({
            type: ChannelType.GuildVoice,
            name: channelName,
            parent: guildConfig.categoryId,
            userLimit: userConfig?.maxUsers || 0,
            permissionOverwrites: [
                {
                    id: user.id,
                    allow: ["MuteMembers", "DeafenMembers", "PrioritySpeaker", "ViewChannel", "Connect", "Speak", "Stream"]
                },
                userConfig?.public ? {
                    id: user.guild.id,
                    allow: ["ViewChannel", "Connect", "Speak", "Stream"]
                } : {
                    id: user.guild.id,
                    deny: ["Connect"]
                },

            ],
        });
        await user.voice.setChannel(channel);
    } catch (error) {
        console.error(error);
    }
}