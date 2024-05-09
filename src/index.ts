import { ActivityType, ButtonInteraction, Client, GuildMember, StringSelectMenuInteraction } from "discord.js";
import { config } from "./config";
import { getCommands } from "./commands";
import { deployCommands } from "./deploy-commands";
import { deployEvents } from "./deploy-events";
import { clHandleButtonInteraction, setUserColorRole } from "./funcs/colorRole";
import { grHandleButtonInteraction, setUserGameRole } from "./funcs/gameRole";

const client = new Client({
  intents: ["Guilds", "GuildMessages", "DirectMessages", "GuildVoiceStates", "GuildMessageReactions", 'GuildEmojisAndStickers', 'GuildMembers', 'GuildModeration', 'MessageContent'],
});

client.once("ready", async () => {
  await deployEvents(client);
  client.user?.setPresence({
    activities: [
      {
        name: "✨ MWIT Revision Group",
        type: ActivityType.Watching,
      },
    ],
    afk: false,
    status: "online",
  });
  console.log("Discord bot is ready! 🤖");
});

client.on("guildCreate", async (guild) => {
  await deployCommands({ guildId: guild.id });
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.isStringSelectMenu()) {
    const stringselectmenu = interaction as StringSelectMenuInteraction;
    const guild = stringselectmenu.guild;
    if (!guild || !stringselectmenu.member) return;
    console.log(stringselectmenu.customId);
    if (stringselectmenu.customId === "color_role_selector") {
      await setUserColorRole(stringselectmenu.member as GuildMember, stringselectmenu.values[0], stringselectmenu);
      return;
    } else if (stringselectmenu.customId === "game_role_selector") {
      await setUserGameRole(stringselectmenu.member as GuildMember, stringselectmenu.values, stringselectmenu);
      return;
    }
  } else if (interaction.isButton()) {
    const guild = interaction.guild;
    if (!guild || !interaction.member) return;
    if (interaction.customId === "show_color_role_selector") {
      await clHandleButtonInteraction(interaction as ButtonInteraction);
      return;
    } else if (interaction.customId === "show_game_role_selector") {
      await grHandleButtonInteraction(interaction as ButtonInteraction);
      return;
    }
  } else if (interaction.isAutocomplete() || interaction.isCommand()) {
    const { commandName } = interaction;
    const commands = await getCommands();
    const command = commands.find((command) => command.data.name === commandName);
    if (!command || (interaction.isAutocomplete() && !command.autocomplete) || (interaction.isCommand() && !command.execute)) return;
    try {
      if (interaction.isAutocomplete() && command.autocomplete) await command.autocomplete(interaction);
      else await command.execute(interaction);
    } catch (error) {
      console.error(error);
      if (interaction.isCommand()) await interaction.reply({
        content: "🔰 เกิดข้อผิดพลาดขึ้นในการเรียกใช้งานคำสั่ง",
        ephemeral: true,
      });
    }
  }
});

client.on("error", console.error);

client.login(config.DISCORD_TOKEN);

export { client };