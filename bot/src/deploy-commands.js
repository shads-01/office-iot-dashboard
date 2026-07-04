/**
 * Deploy Slash Commands
 * =======================
 * One-time script to register Discord slash commands with the Discord API.
 * Run this once after adding/changing commands:
 *   node src/deploy-commands.js
 *
 * For development, deploys to a specific guild (instant).
 * For production, deploy globally (takes up to 1 hour to propagate).
 */

require("dotenv").config();
const { REST, Routes } = require("discord.js");
const statusCommand = require("./commands/status");
const roomCommand = require("./commands/room");
const usageCommand = require("./commands/usage");

const commands = [
  statusCommand.data.toJSON(),
  roomCommand.data.toJSON(),
  usageCommand.data.toJSON(),
];

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

async function deployCommands() {
  try {
    console.log(`[Deploy] Registering ${commands.length} slash commands...`);

    const clientId = process.env.DISCORD_CLIENT_ID;
    const guildId = process.env.DISCORD_GUILD_ID;

    if (!clientId) {
      console.error("[Deploy] DISCORD_CLIENT_ID is required in .env");
      process.exit(1);
    }

    let data;

    if (guildId) {
      // Guild-specific deployment (instant, recommended for development)
      data = await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands }
      );
      console.log(`[Deploy] ✅ Registered ${data.length} guild commands (guild: ${guildId})`);
    } else {
      // Global deployment (takes up to 1 hour to propagate)
      data = await rest.put(
        Routes.applicationCommands(clientId),
        { body: commands }
      );
      console.log(`[Deploy] ✅ Registered ${data.length} global commands`);
    }

    console.log("[Deploy] Commands registered:");
    data.forEach((cmd) => console.log(`  /${cmd.name} — ${cmd.description}`));
  } catch (err) {
    console.error("[Deploy] Failed:", err);
    process.exit(1);
  }
}

deployCommands();
