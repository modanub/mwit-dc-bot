import { CommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
    .setName("ping")
    .setDescription("💬 แสดงรายละเอียดความล่าช้าในการสื่อสารของบอทกับระบบ");

export async function execute(interaction: CommandInteraction) {
  const embed = new EmbedBuilder()
    .setTitle("🏓 Pong!")
    .setDescription(`รายละเอียดความล่าช้าในการสื่อสารของบอทกับระบบ`)
    .addFields(
      {
        name: "✨ ความล่าช้าของ API",
        value: `${interaction.client.ws.ping}ms`,
        inline: true,
      },
      {
        name: "✨ ความล่าช้าของบอท",
        value: `${Date.now() - interaction.createdTimestamp}ms`,
        inline: true,
      }
    )
    .setTimestamp()
    .setColor("#FD81FF");
  await interaction.reply({ embeds: [embed] });
}