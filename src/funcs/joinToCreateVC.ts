import { Guild, VoiceChannel } from "@prisma/client";
import prisma from "../db";
import { Channel, ChannelType, GuildMember, GuildVoiceChannelResolvable, OverwriteResolvable, PermissionsBitField, VoiceBasedChannel, VoiceChannel as vc } from "discord.js";
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

export function constructPermOverwrites(blacklist: string[], whitelist: string[]) {
    let overwrites: OverwriteResolvable[] = [];
    blacklist = blacklist.filter((value, index, self) => value && self.indexOf(value) === index);
    whitelist = whitelist.filter((value, index, self) => value && self.indexOf(value) === index);
    for (const userId of blacklist) {
        overwrites.push({
            id: userId,
            deny: [PermissionsBitField.Flags.Connect],
            allow: [PermissionsBitField.Flags.ViewChannel]
        });
    }
    for (const userId of whitelist) {
        overwrites.push({
            id: userId,
            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.Speak, PermissionsBitField.Flags.Stream]
        });
    }
    return overwrites;
}

export async function refreshChannelPermOverwrites(channel: vc, owner: GuildMember) {
    const userConfig = await getVCConfig(owner.id);
    if (!userConfig) {
        console.warn("Using default values for user ID " + owner.id);
    }
    const whitelist = userConfig?.whitelist?.replace("[", "").replace("]", "").split(", ") || [] as string[];
    const blacklist = userConfig?.blacklist?.replace("[", "").replace("]", "").split(", ") || [] as string[];
    if (userConfig?.public) {
        whitelist.push(owner.guild.roles.everyone.id);
    } else {
        blacklist.push(owner.guild.roles.everyone.id);
    }
    const overwrites = constructPermOverwrites(blacklist, whitelist);
    console.log(overwrites);
    await channel.permissionOverwrites.set(overwrites);
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
        try {
            await user.voice.setChannel(existingVC as VoiceBasedChannel);
        } catch (error) {
            console.error(error);
            await user.voice.disconnect();
        }
        return;
    }
    const whitelist = userConfig?.whitelist?.replace("[", "").replace("]", "").split(", ") || [] as string[];
    const blacklist = userConfig?.blacklist?.replace("[", "").replace("]", "").split(", ") || [] as string[];
    if (userConfig?.public) {
        whitelist.push(user.guild.roles.everyone.id);
    } else {
        blacklist.push(user.guild.roles.everyone.id);
    }
    console.log("Creating channel " + channelName + " for user ID " + user.id)
    const overwrites = constructPermOverwrites(blacklist, whitelist);
    console.log(overwrites);
    try {
        const channel = await user.guild.channels.create({
            type: ChannelType.GuildVoice,
            name: channelName,
            parent: guildConfig.categoryId,
            userLimit: userConfig?.maxUsers || 0,
            permissionOverwrites: overwrites
        });
        await user.voice.setChannel(channel);
    } catch (error) {
        console.error(error);
    }
}