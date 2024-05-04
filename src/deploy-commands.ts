import { REST, Routes } from "discord.js";
import { config } from "./config";
import { getCommands } from "./commands";

const rest = new REST({ version: "10" }).setToken(config.DISCORD_TOKEN);

type DeployCommandsProps = {
  guildId: string;
};

export async function deployCommands({ guildId }: DeployCommandsProps) {
  try {
    console.log("Started refreshing application (/) commands.");
    const commandsData = (await getCommands()).map((command: any) => {
      try {
        return command.data.toJSON();
      } catch (error) {
        console.error(`Failed to load command: ${command.data.name}`);
        console.error(error);
        return null;
      }
    });

    await rest.put(
      Routes.applicationGuildCommands(config.DISCORD_CLIENT_ID, guildId),
      {
        body: commandsData,
      }
    );

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
}