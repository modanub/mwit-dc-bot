import { ActivityType, Client, GuildMember, StringSelectMenuInteraction } from "discord.js";
import { config } from "./config";
import { getCommands } from "./commands";
import { deployCommands } from "./deploy-commands";
import { deployEvents } from "./deploy-events";
import { setUserColorRole } from "./funcs/colorRole";

const client = new Client({
  intents: ["Guilds", "GuildMessages", "DirectMessages", "GuildVoiceStates", "GuildMessageReactions", 'GuildEmojisAndStickers', 'GuildMembers', 'GuildModeration', 'MessageContent'],
});

client.once("ready", async () => {
  await deployEvents(client);
  client.user?.setActivity("somewhere", { type: ActivityType.Competing });
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
    }
  } else if (interaction.isAutocomplete()) {
    const { commandName } = interaction;
    const commands = await getCommands();
    const command = commands.find((command) => command.data.name === commandName);
    if (!command || !command.autocomplete) return;
    try {
      await command.autocomplete(interaction)!;
    } catch (error) {
      console.error(error);
    }
  } else if (interaction.isCommand()) {
    const { commandName } = interaction;
    const commands = await getCommands();
    const command = commands.find((command) => command.data.name === commandName);
    if (!command) return;
    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  }
});

client.on("error", console.error);

client.login(config.DISCORD_TOKEN);

export { client };