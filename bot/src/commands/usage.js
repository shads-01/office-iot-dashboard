/**
 * /usage Command
 * =================
 * Shows total power draw, today's kWh usage, estimated cost,
 * and per-room breakdown. Humanized via Gemini API.
 */

const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { humanize } = require("../gemini");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("usage")
    .setDescription("Get current power usage and today's energy consumption"),

  async execute(interaction, backendUrl) {
    await interaction.deferReply();

    try {
      // Fetch both current power and today's usage
      const [powerRes, todayRes] = await Promise.all([
        fetch(`${backendUrl}/api/power/current`),
        fetch(`${backendUrl}/api/power/today`),
      ]);

      if (!powerRes.ok || !todayRes.ok) {
        throw new Error("Backend returned an error");
      }

      const power = await powerRes.json();
      const today = await todayRes.json();

      // Get humanized response
      const friendlyResponse = await humanize({ power, today }, "usage");

      // Build embed
      const embed = new EmbedBuilder()
        .setTitle("⚡ Office Power Report")
        .setDescription(friendlyResponse)
        .setColor(0xfee75c)
        .setTimestamp();

      // Current total
      embed.addFields({
        name: "🔌 Total Power Right Now",
        value: `**${power.total}W**`,
        inline: true,
      });

      // Today's usage
      embed.addFields({
        name: "📊 Today's Usage",
        value: `**${today.kwh} kWh**`,
        inline: true,
      });

      // Estimated cost
      embed.addFields({
        name: "💰 Estimated Cost",
        value: `**৳${today.estimatedCost}** (at ৳${today.rate}/kWh)`,
        inline: true,
      });

      // Per-room breakdown
      if (power.byRoom) {
        const roomLines = Object.entries(power.byRoom)
          .map(([roomId, room]) => {
            const bar = generatePowerBar(room.watts, 165); // max per room: 2×60 + 3×15 = 165W
            return `**${room.roomName}** ${bar} ${room.watts}W (${room.onCount} devices)`;
          })
          .join("\n");

        embed.addFields({
          name: "🏢 Per-Room Breakdown",
          value: roomLines || "No data",
          inline: false,
        });
      }

      embed.setFooter({ text: "Data refreshes every 5 seconds" });

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error("[/usage] Error:", err.message);
      await interaction.editReply({
        content: "😔 Couldn't reach the backend right now. Is the server running?",
      });
    }
  },
};

/**
 * Generate a simple text-based power bar for Discord.
 * @param {number} current - Current watts
 * @param {number} max - Maximum possible watts
 * @returns {string} A visual power bar
 */
function generatePowerBar(current, max) {
  const percentage = Math.min(current / max, 1);
  const filled = Math.round(percentage * 10);
  const empty = 10 - filled;
  return `[${"█".repeat(filled)}${"░".repeat(empty)}]`;
}
