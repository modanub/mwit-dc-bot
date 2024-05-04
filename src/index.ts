import { ActivityType, Client } from "discord.js";
import { config } from "./config";
import { getCommands } from "./commands";
import { deployCommands } from "./deploy-commands";
import { deployEvents } from "./deploy-events";

const client = new Client({
  intents: ["Guilds", "GuildMessages", "DirectMessages", "GuildVoiceStates", "GuildMessageReactions", 'GuildEmojisAndStickers'],
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
  if (!interaction.isCommand()) {
    return;
  }
  const { commandName } = interaction;
  const commands = await getCommands();
  const command = commands.find((command) => command.data.name === commandName);
  if (!command) {
    return;
  }
  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: "There was an error while executing this command!",
      ephemeral: true,
    });
  }
});

client.on("error", console.error);

client.login(config.DISCORD_TOKEN);

export { client };