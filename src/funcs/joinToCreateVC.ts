import { Guild, VoiceChannel } from "@prisma/client";
import prisma from "../db";
import { ChannelType, GuildMember, OverwriteResolvable, User } from "discord.js";

async function getVCConfig(userId: string): Promise<VoiceChannel | null> {
    try {
        return await prisma.voiceChannel.findFirst({
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

export async function createVC(guildId: string, guildConfig: Guild, user: GuildMember) {
    if (!guildConfig) {
        console.error("Guild config not found for guild ID " + guildId);
        return;
    }
    const userConfig = await getVCConfig(user.id);
    if (!userConfig) {
        console.warn("Using default values for user ID " + user.id);
    }
    const channelName = userConfig?.name || "⭐ " + user.displayName;
    let whitelist: OverwriteResolvable[] = [];
    for (const userId of userConfig?.whitelist?.split(",") || [] as string[]) {
        if (userId === user.id) continue;
        whitelist.push({
            id: userId,
            allow: ["ViewChannel", "Connect", "Speak", "Stream"]
        });
    }
    let blacklist: OverwriteResolvable[] = [];
    for (const userId of userConfig?.blacklist?.split(",") || [] as string[]) {
        if (userId === user.id) continue;
        blacklist.push({
            id: userId,
            deny: ["Connect"],
            allow: ["ViewChannel"]
        });
    }
    try {
        const channel = await user.guild.channels.create({
            type: ChannelType.GuildVoice,
            name: channelName,
            parent: guildConfig.categoryId,
            permissionOverwrites: [
                {
                    id: user.id,
                    allow: ["MuteMembers", "DeafenMembers", "PrioritySpeaker", "ViewChannel"]
                },
                ...whitelist,
                ...blacklist
            ],
        });
        await user.voice.setChannel(channel);
    } catch (error) {
        console.error(error);
    }
}