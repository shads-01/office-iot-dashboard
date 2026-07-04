/**
 * /status Command
 * =================
 * Shows the current on/off state of all 15 devices, organized by room.
 * Response is humanized via Gemini API for a friendly, conversational tone.
 */

const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { humanize } = require("../gemini");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("status")
    .setDescription("Get the current status of all office devices"),

  async execute(interaction, backendUrl) {
    await interaction.deferReply();

    try {
      const response = await fetch(`${backendUrl}/api/devices`);
      if (!response.ok) throw new Error(`Backend returned ${response.status}`);

      const data = await response.json();

      // Get humanized response from Gemini
      const friendlyResponse = await humanize(data, "status");

      // Build a rich embed
      const embed = new EmbedBuilder()
        .setTitle("🏢 Office Device Status")
        .setDescription(friendlyResponse)
        .setColor(0x5865f2) // Discord blurple
        .setTimestamp()
        .setFooter({ text: `${data.count} devices monitored` });

      // Add per-room summary fields
      const rooms = {};
      data.devices.forEach((d) => {
        const roomName = d.roomName || d.room;
        if (!rooms[roomName]) rooms[roomName] = [];
        rooms[roomName].push(d);
      });

      for (const [roomName, devices] of Object.entries(rooms)) {
        const onDevices = devices.filter((d) => d.status === "on");
        const totalWatts = onDevices.reduce((sum, d) => sum + d.wattage, 0);

        const deviceLines = devices.map((d) => {
          const icon = d.status === "on"
            ? (d.type === "fan" ? "🌀" : "💡")
            : "⭕";
          return `${icon} ${d.name}: **${d.status.toUpperCase()}**`;
        });

        embed.addFields({
          name: `${roomName} (${totalWatts}W)`,
          value: deviceLines.join("\n") || "No devices",
          inline: true,
        });
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error("[/status] Error:", err.message);
      await interaction.editReply({
        content: "😔 Couldn't reach the backend right now. Is the server running?",
      });
    }
  },
};
