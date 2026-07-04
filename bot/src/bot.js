/**
 * Office IoT Dashboard — Discord Bot
 * =====================================
 * A Discord bot that answers questions about office device status,
 * power usage, and alerts. Uses Gemini API for friendly, conversational
 * responses. Also posts proactive alert notifications when anomalous
 * conditions are detected (e.g., devices left on after hours).
 *
 * Commands:
 *   /status  — Current status of all office devices
 *   /room    — Status of a specific room (with autocomplete)
 *   /usage   — Power consumption and cost breakdown
 *
 * Proactive Alerts:
 *   Connects to the backend via Socket.IO to receive real-time alerts
 *   and posts them to a designated #office-alerts channel.
 */

require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  Collection,
  EmbedBuilder,
} = require("discord.js");
const { io: ioClient } = require("socket.io-client");
const { initGemini, humanize } = require("./gemini");

// ─── Load Commands ──────────────────────────────────────────────────
const statusCommand = require("./commands/status");
const roomCommand = require("./commands/room");
const usageCommand = require("./commands/usage");

// ─── Configuration ──────────────────────────────────────────────────
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000";
const ALERT_CHANNEL_ID = process.env.ALERT_CHANNEL_ID;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// ─── Initialize Gemini ──────────────────────────────────────────────
const geminiReady = initGemini(GEMINI_API_KEY);
if (geminiReady) {
  console.log("[Bot] Gemini API integration enabled");
} else {
  console.log("[Bot] Gemini API not available — using fallback formatting");
}

// ─── Create Discord Client ─────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ],
});

// Register commands in a collection for lookup
const commands = new Collection();
commands.set(statusCommand.data.name, statusCommand);
commands.set(roomCommand.data.name, roomCommand);
commands.set(usageCommand.data.name, usageCommand);

// ─── Bot Ready Event ────────────────────────────────────────────────
client.once("ready", () => {
  console.log(`\n╔════════════════════════════════════════════════╗`);
  console.log(`║  Office IoT Dashboard — Discord Bot            ║`);
  console.log(`║  Logged in as ${client.user.tag.padEnd(32)}║`);
  console.log(`║  Backend: ${BACKEND_URL.padEnd(36)}║`);
  console.log(`║  Gemini: ${geminiReady ? "Enabled ✅" : "Fallback mode ⚠️ "}${" ".repeat(25)}║`);
  console.log(`╚════════════════════════════════════════════════╝\n`);

  // Connect to backend Socket.IO for proactive alerts
  connectToBackendAlerts();
});

// ─── Slash Command Handler ──────────────────────────────────────────
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = commands.get(interaction.commandName);

  if (!command) {
    console.warn(`[Bot] Unknown command: ${interaction.commandName}`);
    return;
  }

  try {
    console.log(
      `[Bot] Command /${interaction.commandName} by ${interaction.user.tag}`
    );
    await command.execute(interaction, BACKEND_URL);
  } catch (err) {
    console.error(`[Bot] Error executing /${interaction.commandName}:`, err);

    const errorMsg = {
      content: "😔 Something went wrong while processing that command. Try again in a moment!",
      ephemeral: true,
    };

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(errorMsg);
    } else {
      await interaction.reply(errorMsg);
    }
  }
});

// ─── Proactive Alert System ─────────────────────────────────────────

/**
 * Connect to the backend's Socket.IO to receive real-time alerts
 * and post them to the designated Discord channel.
 */
function connectToBackendAlerts() {
  if (!ALERT_CHANNEL_ID) {
    console.log("[Bot] No ALERT_CHANNEL_ID set — proactive alerts disabled");
    return;
  }

  console.log(`[Bot] Connecting to backend Socket.IO at ${BACKEND_URL}...`);

  const socket = ioClient(BACKEND_URL, {
    reconnection: true,
    reconnectionDelay: 5000,
    reconnectionAttempts: Infinity,
  });

  socket.on("connect", () => {
    console.log("[Bot] ✅ Connected to backend Socket.IO for alerts");
  });

  socket.on("disconnect", (reason) => {
    console.log(`[Bot] ⚠️ Disconnected from backend: ${reason}`);
  });

  socket.on("connect_error", (err) => {
    console.log(`[Bot] Socket.IO connection error: ${err.message}`);
  });

  // Listen for new alerts from the backend
  socket.on("alert:new", async (alert) => {
    console.log(`[Bot] 🚨 New alert received: ${alert.type} — ${alert.message}`);
    await postAlertToChannel(alert);
  });
}

/**
 * Post an alert notification to the designated Discord channel.
 */
async function postAlertToChannel(alert) {
  try {
    const channel = await client.channels.fetch(ALERT_CHANNEL_ID);

    if (!channel || !channel.isTextBased()) {
      console.error("[Bot] Alert channel not found or not a text channel");
      return;
    }

    // Get humanized alert message
    const friendlyMessage = await humanize(alert, "alert");

    // Color based on severity
    const colors = {
      warning: 0xfee75c,  // Yellow
      danger: 0xed4245,   // Red
      info: 0x5865f2,     // Blue
    };

    const embed = new EmbedBuilder()
      .setTitle(alert.type === "after-hours" ? "⚠️ After-Hours Alert" : "🔴 Prolonged Usage Alert")
      .setDescription(friendlyMessage)
      .setColor(colors[alert.severity] || colors.warning)
      .setTimestamp(new Date(alert.timestamp));

    if (alert.roomName) {
      embed.addFields({ name: "Room", value: alert.roomName, inline: true });
    }

    if (alert.deviceDetails && alert.deviceDetails.length > 0) {
      const deviceList = alert.deviceDetails
        .map((d) => `${d.type === "fan" ? "🌀" : "💡"} ${d.name}`)
        .join(", ");
      embed.addFields({ name: "Devices", value: deviceList, inline: true });
    }

    embed.setFooter({ text: "Office IoT Monitor • Automated Alert" });

    await channel.send({ embeds: [embed] });
    console.log(`[Bot] ✅ Alert posted to #${channel.name}`);
  } catch (err) {
    console.error("[Bot] Failed to post alert:", err.message);
  }
}

// ─── Graceful Shutdown ──────────────────────────────────────────────
process.on("SIGINT", () => {
  console.log("\n[Bot] Shutting down...");
  client.destroy();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n[Bot] Shutting down...");
  client.destroy();
  process.exit(0);
});

// ─── Login ──────────────────────────────────────────────────────────
const token = process.env.DISCORD_TOKEN;

if (!token) {
  console.error("[Bot] DISCORD_TOKEN is required in .env file");
  process.exit(1);
}

client.login(token);
