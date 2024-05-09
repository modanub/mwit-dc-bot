import { APIActionRowComponent, APIMessageActionRowComponent, ActionRowBuilder, AutocompleteInteraction, ButtonBuilder, ButtonStyle, CommandInteraction, CommandInteractionOptionResolver, EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder, TextChannel } from "discord.js";
import { createColorRole, deleteColorRole, getColorRoles } from "../../funcs/colorRole";

export const data = new SlashCommandBuilder()
    .setName("color")
    .setDescription("⚙️ ตั้งค่ายศสี")
    .addSubcommand(subcommand =>
        subcommand
        .setName("add")
            .setDescription("➕ เพิ่มยศสีใหม่")
            .addStringOption(option =>
                option
                    .setName("name")
                    .setDescription("🧾 ชื่อของยศสีที่ต้องการสร้าง")
                    .setRequired(true)
                )
            .addRoleOption(option =>
                option
                    .setName("role")
                    .setDescription("🛡️ ยศที่ต้องการให้เป็นสีนี้")
                    .setRequired(true)
            )
        )
    .addSubcommand(subcommand =>
        subcommand
            .setName("remove")
            .setDescription("➖ ลบยศสี")
            .addStringOption(option =>
                option
                .setName("name")
                .setDescription("🧾 ชื่อของยศสีที่ต้องการลบ")
                .setRequired(true)
                .setAutocomplete(true)
            )
        )
    .addSubcommand(subcommand =>
        subcommand
            .setName("sendembed")
            .setDescription("📤 ส่ง embed + ปุ่มในห้องที่ต้องการเพื่อเลือกยศสี")
            .addChannelOption(option =>
                option
                .setName("channel")
                .setDescription("📡 ห้องที่ต้องการส่ง embed และปุ่ม")
                .setRequired(true)
            )
        )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
export async function autocomplete(interaction: AutocompleteInteraction) {
    if (!interaction.guild) { return null; }
    const subcommand = interaction.options.getSubcommand();
    const focusedValue = interaction.options.getFocused();
    if (subcommand === "remove") {
        const colorRoles = await getColorRoles(interaction.guild);
        const options = colorRoles.map(role => {
            return {
                name: role.color,
                value: role.color
            }
        });
        return interaction.respond(options.filter(option => option.name.includes(focusedValue)).slice(0, 25));       
    }
}
export async function execute(interaction: CommandInteraction) {
    const subcommand = (interaction.options as CommandInteractionOptionResolver).getSubcommand();
    switch (subcommand) {
        case "add": {
            const name = (interaction.options as CommandInteractionOptionResolver).getString("name");
            const role = (interaction.options as CommandInteractionOptionResolver).getRole("role");
            if (!name || !role) { return interaction.reply("❌ คำสั่งไม่ถูกต้อง"); }
            const guild = interaction.guild;
            if (!guild) { return interaction.reply("❌ คำสั่งนี้ต้องใช้ในเซิร์ฟเวอร์เท่านั้น"); }
            try {
                await createColorRole(guild, name, role.id);
            } catch (error) {
                console.error(error);
                return interaction.reply("⚠️ เกิดข้อผิดพลาดขณะสร้างยศสี");
            }
            return interaction.reply({ content: `🎉 ตั้งค่ายศ${role}สำหรับสี${name}เสร็จสิ้น`, ephemeral: true });
        }
        case "remove": {
            const name = (interaction.options as CommandInteractionOptionResolver).getString("name");
            if (!name) { return interaction.reply("❌ คำสั่งไม่ถูกต้อง."); }
            const guild = interaction.guild;
            if (!guild) { return interaction.reply("❌ คำสั่งนี้ต้องใช้ในเซิร์ฟเวอร์เท่านั้น"); }
            try {
                await deleteColorRole(guild, name);
            } catch (error) {
                console.error(error);
                return interaction.reply("⚠️ เกิดข้อผิดพลาดขณะลบยศสี.");
            }
            return interaction.reply({ content: `🎉 ลบยศสี${name}เสร็จสิ้น`, ephemeral: true });
        }
        case "sendembed": {
            const channel = (interaction.options as CommandInteractionOptionResolver).getChannel("channel");
            if (!channel) { return interaction.reply("❌ คำสั่งไม่ถูกต้อง"); }
            if (!interaction.guild) { return interaction.reply("❌ คำสั่งนี้ต้องใช้ในเซิร์ฟเวอร์เท่านั้น"); }
            const msg = "กดปุ่มด้านล่างเพื่อแสดงสีชื่อและเมนูเลือกสีชื่อ";
            const btn = new ButtonBuilder()
                .setCustomId("show_color_role_selector")
                .setLabel("🎨 แสดงเมนูเลือกสี")
                .setStyle(ButtonStyle.Primary);
            const row = new ActionRowBuilder()
                .addComponents(btn);
            await (channel as TextChannel).send({ content: msg, components: [row as unknown as APIActionRowComponent<APIMessageActionRowComponent>] });
            return interaction.reply("🎉 ส่ง embed และปุ่มสำหรับเลือกสีเสร็จสิ้น");
        }
        default:
            return interaction.reply("❌ คำสั่งไม่ถูกต้อง");
    }
}