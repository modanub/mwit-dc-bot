import { ChannelType, VoiceState } from "discord.js";
import { createVC, getGuildConfig } from "../funcs/joinToCreateVC";
export const once = false;
export const name = "voiceStateUpdate";

export async function execute(oldState: VoiceState, newState: VoiceState) {
    const member = newState.member;
    if (!member || member.user.bot) return;
    if (oldState.channelId === newState.channelId) return;
    if (oldState.channel && oldState.channel.members.size === 0 && oldState.channel.name.startsWith("⭐")) {
        oldState.channel.delete();
        console.log(`Deleted empty voice channel ${oldState.channel.name}`);
    }
    if (!newState.channelId) return;
    const channel = newState.guild.channels.cache.get(newState.channelId);
    if (!channel || channel.type !== ChannelType.GuildVoice) return;
    const guildConfig = await getGuildConfig(newState.guild.id);
    if (!guildConfig) return;
    if (guildConfig.joinToCreateChannel === newState.channelId) {
        console.log(`User ${member.user.tag} joined join-to-create channel`);
        createVC(newState.guild.id, guildConfig, member);
    }
}