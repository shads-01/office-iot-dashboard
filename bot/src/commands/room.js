/**
 * /room Command
 * ================
 * Shows the status of a specific room's devices.
 * Includes autocomplete for room name selection.
 * Response is humanized via Gemini API.
 */

const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { humanize } = require("../gemini");

/** Valid room IDs and their display names */
const VALID_ROOMS = [
  { id: "drawingroom", name: "Drawing Room" },
  { id: "workroom1", name: "Work Room 1" },
  { id: "workroom2", name: "Work Room 2" },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("room")
    .setDescription("Get the status of a specific room")
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("The room to check")
        .setRequired(true)
        .addChoices(
          ...VALID_ROOMS.map((r) => ({ name: r.name, value: r.id }))
        )
    ),

  async execute(interaction, backendUrl) {
    await interaction.deferReply();

    const roomId = interaction.options.getString("name");

    try {
      const response = await fetch(`${backendUrl}/api/rooms/${roomId}`);

      if (response.status === 404) {
        await interaction.editReply({
          content: `❌ Room "${roomId}" not found. Valid rooms: ${VALID_ROOMS.map((r) => `\`${r.id}\``).join(", ")}`,
        });
        return;
      }

      if (!response.ok) throw new Error(`Backend returned ${response.status}`);

      const data = await response.json();

      // Get humanized response
      const friendlyResponse = await humanize(data, "room");

      // Determine room status color
      const allOff = data.summary.on === 0;
      const allOn = data.summary.on === data.summary.total;
      const color = allOff ? 0x57f287 : allOn ? 0xed4245 : 0xfee75c; // green, red, yellow

      const embed = new EmbedBuilder()
        .setTitle(`🏠 ${data.room}`)
        .setDescription(friendlyResponse)
        .setColor(color)
        .setTimestamp();

      // Add device details
      const fans = data.devices.filter((d) => d.type === "fan");
      const lights = data.devices.filter((d) => d.type === "light");

      if (fans.length > 0) {
        embed.addFields({
          name: "🌀 Fans",
          value: fans
            .map((f) => {
              const status = f.status === "on" ? "🟢 ON" : "🔴 OFF";
              return `${f.name}: ${status} (${f.wattage}W)`;
            })
            .join("\n"),
          inline: true,
        });
      }

      if (lights.length > 0) {
        embed.addFields({
          name: "💡 Lights",
          value: lights
            .map((l) => {
              const status = l.status === "on" ? "🟢 ON" : "🔴 OFF";
              return `${l.name}: ${status} (${l.wattage}W)`;
            })
            .join("\n"),
          inline: true,
        });
      }

      // Power summary
      embed.addFields({
        name: "⚡ Power",
        value: `**${data.summary.watts}W** total (${data.summary.on}/${data.summary.total} devices ON)`,
        inline: false,
      });

      embed.setFooter({ text: data.description || "Office room" });

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error("[/room] Error:", err.message);
      await interaction.editReply({
        content: "😔 Couldn't reach the backend right now. Is the server running?",
      });
    }
  },
};
