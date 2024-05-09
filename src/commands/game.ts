import { APIActionRowComponent, APIMessageActionRowComponent, ActionRowBuilder, AutocompleteInteraction, ButtonBuilder, ButtonStyle, CommandInteraction, CommandInteractionOptionResolver, EmbedBuilder, GuildMember, PermissionFlagsBits, PermissionsBitField, SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, TextChannel } from "discord.js";
import { createGameRole, deleteGameRole, getGameRole, getGameRoles } from "../funcs/gameRole";

export const data = new SlashCommandBuilder()
    .setName("game")
    .setDescription("🎮 คำสั่งยศเกม")
    .addSubcommand(subcommand =>
        subcommand
            .setName("add")
            .setDescription("⚙️ เพิ่มยศเกมใหม่")
            .addStringOption(option =>
                option
                    .setName("name")
                    .setDescription("🧾 ชื่อเกม")
                    .setRequired(true)
                )
            .addRoleOption(option =>
                option
                    .setName("role")
                    .setDescription("🛡️ ยศที่ต้องการให้เป็นยศเกมนี้")
                    .setRequired(true)
            )
        )
    .addSubcommand(subcommand =>
        subcommand
            .setName("remove")
            .setDescription("⚙️ ลบยศเกม")
            .addStringOption(option =>
                option
                .setName("name")
                .setDescription("🧾 ชื่อเกม")
                .setRequired(true)
                .setAutocomplete(true)
            )
        )
    .addSubcommand(subcommand =>
        subcommand
            .setName("sendembed")
            .setDescription("📤 ส่ง embed + ปุ่มในห้องที่ต้องการเพื่อเลือกยศเกม")
            .addChannelOption(option =>
                option
                .setName("channel")
                .setDescription("📡 ห้องที่ต้องการส่ง embed และปุ่ม")
                .setRequired(true)
            )
        )
    .addSubcommand(subcommand =>
        subcommand
            .setName("list")
            .setDescription("🎮 รายชื่อยศเกม")
        )
    // .addSubcommand(subcommand =>
    //     subcommand
    //         .setName("join")
    //         .setDescription("🧪 เพิ่มยศเกมที่คุณเล่น")
    //         .addStringOption(option =>
    //             option
    //             .setName("name")
    //             .setDescription("🧾 ชื่อเกม")
    //             .setRequired(true)
    //             .setAutocomplete(true)
    //         )
    //     )
    // .addSubcommand(subcommand =>
    //     subcommand
    //         .setName("leave")
    //         .setDescription("🧪 ลบยศเกมที่คุณเล่น")
    //         .addStringOption(option =>
    //             option
    //             .setName("name")
    //             .setDescription("🧾 ชื่อเกม")
    //             .setRequired(true)
    //             .setAutocomplete(true)
    //         )
    //     );
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
export async function autocomplete(interaction: AutocompleteInteraction) {
    if (!interaction.guild) { return null; }
    const subcommand = interaction.options.getSubcommand();
    const focusedValue = interaction.options.getFocused();
    if (subcommand === "remove" || subcommand === "join") {
        const gameRoles = await getGameRoles(interaction.guild);
        const options = gameRoles.map(role => {
            return {
                name: role.game,
                value: role.game
            }
        });
        return interaction.respond(options.filter(option => option.name.includes(focusedValue)).slice(0, 25));      
    }
    if (subcommand === "leave") {
        const member = interaction.member as GuildMember;
        if (!member) { return null; }
        const gameRoles = await getGameRoles(interaction.guild);
        const options = gameRoles.filter(role => member.roles.cache.has(role.roleId)).map(role => {
            return {
                name: role.game,
                value: role.game
            }
        });
        return interaction.respond(options.filter(option => option.name.includes(focusedValue)).slice(0, 25));
    }
}
export async function execute(interaction: CommandInteraction) {
    if (!interaction.guild) { return interaction.reply({ content: "❌ คำสั่งนี้ต้องใช้ในเซิร์ฟเวอร์เท่านั้น", ephemeral: true }); }
    const subcommand = (interaction.options as CommandInteractionOptionResolver).getSubcommand();
    switch (subcommand) {
        case "add": {
            if (!(interaction.member?.permissions as PermissionsBitField).has(PermissionFlagsBits.Administrator)) { return interaction.reply({ content: "❌ คุณไม่มีสิทธิ์ในการใช้คำสั่งนี้", ephemeral: true }); }
            const name = (interaction.options as CommandInteractionOptionResolver).getString("name");
            if (!name) { return interaction.reply({ content: "❌ คำสั่งไม่ถูกต้อง", ephemeral: true }); }
            try {
                const role = (interaction.options as CommandInteractionOptionResolver).getRole("role");
                if (!role) { return interaction.reply({ content: "❌ คำสั่งไม่ถูกต้อง", ephemeral: true }); }
                await createGameRole(interaction.guild, role.id, name);
                return interaction.reply({ content: `✅ สร้างยศเกม ${name} เสร็จสิ้น`, ephemeral: true });
            } catch (error) {
                console.error(error);
                return interaction.reply({ content: "⚠️ เกิดข้อผิดพลาดขณะสร้างยศเกม", ephemeral: true });
            }
        }
        case "remove": {
            if (!(interaction.member?.permissions as PermissionsBitField).has(PermissionFlagsBits.Administrator)) { return interaction.reply({ content: "❌ คุณไม่มีสิทธิ์ในการใช้คำสั่งนี้", ephemeral: true }); }
            const name = (interaction.options as CommandInteractionOptionResolver).getString("name");
            if (!name) { return interaction.reply({ content: "❌ คำสั่งไม่ถูกต้อง", ephemeral: true }); }
            try {
                await deleteGameRole(interaction.guild, name);
                return interaction.reply({ content: `✅ ลบยศเกม ${name} เสร็จสิ้น`, ephemeral: true });
            } catch (error) {
                console.error(error);
                return interaction.reply({ content: "⚠️ เกิดข้อผิดพลาดขณะลบยศเกม", ephemeral: true });
            }
        }
        case "sendembed": {
            if (!(interaction.member?.permissions as PermissionsBitField).has(PermissionFlagsBits.Administrator)) { return interaction.reply({ content: "❌ คุณไม่มีสิทธิ์ในการใช้คำสั่งนี้", ephemeral: true }); }
            const channel = (interaction.options as CommandInteractionOptionResolver).getChannel("channel");
            if (!channel) { return interaction.reply({ content: "❌ คำสั่งไม่ถูกต้อง", ephemeral: true }); }
            const gameRoles = await getGameRoles(interaction.guild);
            if (gameRoles.length === 0) { return interaction.reply({ content: "❌ ไม่มียศเกมในเซิร์ฟเวอร์นี้", ephemeral: true }); }
            const msg = "กดปุ่มด้านล่างเพื่อแสดงรายชื่อยศเกมและเมนูเลือกยศเกม";
            const btn = new ButtonBuilder()
                .setCustomId("show_game_role_selector")
                .setLabel("🎮 แสดงเมนูเลือกยศเกม")
                .setStyle(ButtonStyle.Primary);
            const row = new ActionRowBuilder()
                .addComponents(btn);
            await (channel as TextChannel).send({ content: msg, components: [row as unknown as APIActionRowComponent<APIMessageActionRowComponent>] });
            return interaction.reply({ content: "✅ ส่ง embed และปุ่มเรียบร้อย", ephemeral: true });
        }
        case "list": {
            const gameRoles = await getGameRoles(interaction.guild);
            if (gameRoles.length === 0) { return interaction.reply({ content: "❌ ไม่มียศเกมในเซิร์ฟเวอร์นี้", ephemeral: true }); }
            const guildmember = interaction.member as GuildMember;
            const embed = new EmbedBuilder()
                .setTitle("🎮 รายชื่อยศเกม")
                .setColor("#ED9A3D")
                .setDescription(gameRoles.map(role => `- <@&${role.roleId}> - ${role.game}`).join("\n"));
            const selector = new StringSelectMenuBuilder()
                .setCustomId("game_role_selector")
                .setPlaceholder("🎮 เลือกยศเกมที่ต้องการ")
                .setMinValues(0)
                .setMaxValues(5)
                .addOptions(gameRoles.map(role => {
                    return new StringSelectMenuOptionBuilder()
                        .setLabel(role.game)
                        .setValue(role.roleId)
                        .setDefault(guildmember.roles.cache.has(role.roleId))
                }));
            const row = new ActionRowBuilder()
                .addComponents(selector);
            return interaction.reply({ embeds: [embed], components: [row as unknown as APIActionRowComponent<APIMessageActionRowComponent>], ephemeral: true });
        }
        case "join": {
            const name = (interaction.options as CommandInteractionOptionResolver).getString("name");
            if (!name) { return interaction.reply({ content: "❌ คำสั่งไม่ถูกต้อง", ephemeral: true }); }
            const gameRole = await getGameRole(interaction.guild, name);
            if (!gameRole) { return interaction.reply({ content: "❌ ไม่พบยศเกมนี้", ephemeral: true }); }
            const member = interaction.member as GuildMember;
            if (!member) { return interaction.reply({ content: "❌ คำสั่งนี้ต้องใช้โดยสมาชิกเท่านั้น", ephemeral: true }); }
            if (member.roles.cache.has(gameRole.roleId)) { return interaction.reply({ content: "🧾 คุณมียศเกมนี่อยู่แล้ว", ephemeral: true }) }
            try {
                await member.roles.add(gameRole.roleId);
                return interaction.reply({ content: `✅ เพิ่มยศเกม ${name} เสร็จสิ้น`, ephemeral: true });
            } catch (error) {
                console.error(error);
                return interaction.reply({ content: "⚠️ เกิดข้อผิดพลาดขณะเพิ่มยศเกม", ephemeral: true });
            }
        }
        case "leave": {
            const name = (interaction.options as CommandInteractionOptionResolver).getString("name");
            if (!name) { return interaction.reply({ content: "❌ คำสั่งไม่ถูกต้อง", ephemeral: true }); }
            const gameRole = await getGameRole(interaction.guild, name);
            if (!gameRole) { return interaction.reply({ content: "❌ ไม่พบยศเกมนี้", ephemeral: true }); }
            const member = interaction.member as GuildMember;
            if (!member) { return interaction.reply({ content: "❌ คำสั่งนี้ต้องใช้โดยสมาชิกเท่านั้น", ephemeral: true }); }
            if (!member.roles.cache.has(gameRole.roleId)) { return interaction.reply({ content: "🧾 คุณไม่มียศเกมนี่", ephemeral: true }) }
            try {
                await member.roles.remove(gameRole.roleId);
                return interaction.reply({ content: `✅ ลบยศเกม ${name} เสร็จสิ้น`, ephemeral: true });
            } catch (error) {
                console.error(error);
                return interaction.reply({ content: "⚠️ เกิดข้อผิดพลาดขณะลบยศเกม", ephemeral: true });
            }
        }
    }
}