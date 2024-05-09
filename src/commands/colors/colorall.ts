import { AutocompleteInteraction, CommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { getColorRoles } from "../../funcs/colorRole";

export const data = new SlashCommandBuilder()
    .setName("colorall")
    .setDescription("🎨 ตั้งค่าสีให้กับทุกคนในเซิร์ฟเวอร์")
    .addStringOption(option =>
        option
        .setName("color")
        .setDescription("สีที่ต้องการให้กับทุกคนในเซิร์ฟเวอร์")
        .setRequired(true)
        .setAutocomplete(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
export async function autocomplete(interaction: AutocompleteInteraction) {
    if (!interaction.guild) { return null; }
    const focusedValue = interaction.options.getFocused();
    const colorRoles = await getColorRoles(interaction.guild);
    const options = colorRoles.map(role => {
        return {
            name: role.color,
            value: role.color
        }
    });
    return interaction.respond(options.filter(option => option.name.includes(focusedValue)).slice(0, 25));       
}
export async function execute(interaction: CommandInteraction) {
    const color = interaction.options.get("color");
    if (!color) { return interaction.reply("❌ คำสั่งไม่ถูกต้อง"); }
    const guild = interaction.guild;
    if (!guild) { return interaction.reply("❌ คำสั่งนี้ต้องใช้ในเซิร์ฟเวอร์เท่านั้น"); }
    await interaction.deferReply();
    let members
    try {
        members = await guild.members.fetch();
    } catch (error) {
        console.error(error);
        return await interaction.followUp("⚠️ เกิดข้อผิดพลาดในขณะที่กำลังให้สีให้สมาชิก");
    }
    const colorRoles = await getColorRoles(guild);
    const colorRole = colorRoles.find(role => role.color === color.value);
    if (!colorRole) { return interaction.reply("❌ ไม่พบสีที่ระบุในระบบ"); }
    let count = 0;
    console.log(`Assigning color role ${colorRole.color} to ${members.size} members.`)
    for (const member of members.values()) {
        if (count >= 50) { break; }
        if (member.user.bot) { continue; }
        if (member.roles.cache.has(colorRole.roleId)) {
            console.log(`Color role ${colorRole.color} already assigned to ${member.user.tag}`);
            continue;
        }
        try {
            await member.roles.add(colorRole.roleId);
            console.log(`Color role ${colorRole.color} assigned to ${member.user.tag}`);
        } catch (error) {
            console.error(error);
            return await interaction.followUp("⚠️ เกิดข้อผิดพลาดในขณะที่กำลังให้สีให้สมาชิก");
        }
        count++;
    }
    await interaction.followUp(`✅ สี ${colorRole.color} ถูกให้กับ ${count} สมาชิก`);
}