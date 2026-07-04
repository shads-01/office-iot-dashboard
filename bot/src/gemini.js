/**
 * Gemini API Integration
 * ========================
 * Uses Google's Gemini API to transform raw device/power JSON
 * into warm, conversational responses for the Discord bot.
 * Falls back to a structured text formatter if the API is unavailable.
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");

let genAI;
let model;

/**
 * Initialize the Gemini client.
 * Call this once at bot startup.
 */
function initGemini(apiKey) {
  if (!apiKey) {
    console.warn("[Gemini] No API key provided — will use fallback formatting");
    return false;
  }

  try {
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    console.log("[Gemini] Initialized with gemini-2.0-flash model");
    return true;
  } catch (err) {
    console.error("[Gemini] Failed to initialize:", err.message);
    return false;
  }
}

/**
 * System prompt that shapes Gemini's personality for the office assistant.
 */
const SYSTEM_PROMPT = `You are a friendly, warm office assistant bot named "OfficeBot" living in a Discord server. 
Your job is to report on the status of office lights and fans in a way that's helpful but also fun and personable.

Rules:
- Keep responses SHORT (2-4 sentences max, unless there's a lot to report).
- Use a casual, friendly tone — the boss hates robotic data dumps.
- Use relevant emojis sparingly (💡🌀⚡ etc.) to make it visual.
- If everything is off, celebrate the energy savings.
- If lots of things are on after hours, gently nag about it.
- Always include the actual numbers from the data — don't make stuff up.
- Format power in Watts (W) and energy in kWh.
- If there are costs, show them in BDT (৳).
- Don't use markdown headers or code blocks — this is Discord chat, keep it natural.
- Never say you're an AI or mention being powered by Gemini.`;

/**
 * Humanize raw data using Gemini API.
 * @param {object} rawData - The raw JSON data from the backend
 * @param {string} context - What kind of response this is (status, room, usage)
 * @returns {string} A friendly, conversational response
 */
async function humanize(rawData, context = "status") {
  // If Gemini isn't available, use fallback
  if (!model) {
    return fallbackFormat(rawData, context);
  }

  try {
    const prompt = buildPrompt(rawData, context);

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      generationConfig: {
        maxOutputTokens: 300,
        temperature: 0.7,
      },
    });

    const response = result.response.text().trim();

    // Sanity check: if response is empty or too short, use fallback
    if (!response || response.length < 10) {
      return fallbackFormat(rawData, context);
    }

    return response;
  } catch (err) {
    console.error("[Gemini] API error, using fallback:", err.message);
    return fallbackFormat(rawData, context);
  }
}

/**
 * Build a context-specific prompt for Gemini.
 */
function buildPrompt(rawData, context) {
  switch (context) {
    case "status":
      return `Here's the current status of all office devices. Summarize this for the boss in a friendly way, organized by room:\n\n${JSON.stringify(rawData, null, 2)}`;

    case "room":
      return `Here's the status of a specific office room. Give a concise, friendly summary:\n\n${JSON.stringify(rawData, null, 2)}`;

    case "usage":
      return `Here's the current power usage data for the office. Summarize it in a friendly, easy-to-understand way. Mention the total watts, today's kWh, and estimated cost:\n\n${JSON.stringify(rawData, null, 2)}`;

    case "alert":
      return `An alert condition has been detected in the office. Write a short, attention-grabbing notification message:\n\n${JSON.stringify(rawData, null, 2)}`;

    default:
      return `Summarize this office data in a friendly way:\n\n${JSON.stringify(rawData, null, 2)}`;
  }
}

/**
 * Fallback formatter when Gemini API is unavailable.
 * Produces clean, structured text without AI assistance.
 */
function fallbackFormat(rawData, context) {
  switch (context) {
    case "status":
      return formatStatus(rawData);
    case "room":
      return formatRoom(rawData);
    case "usage":
      return formatUsage(rawData);
    case "alert":
      return formatAlert(rawData);
    default:
      return JSON.stringify(rawData, null, 2);
  }
}

/**
 * Format a full status response (all rooms).
 */
function formatStatus(data) {
  if (!data || !data.devices) return "Couldn't fetch device data right now 😔";

  const rooms = {};
  data.devices.forEach((d) => {
    if (!rooms[d.roomName || d.room]) {
      rooms[d.roomName || d.room] = { fans: { on: 0, total: 0 }, lights: { on: 0, total: 0 } };
    }
    const room = rooms[d.roomName || d.room];
    if (d.type === "fan") {
      room.fans.total++;
      if (d.status === "on") room.fans.on++;
    } else {
      room.lights.total++;
      if (d.status === "on") room.lights.on++;
    }
  });

  let msg = "🏢 **Office Status Update**\n\n";
  for (const [name, room] of Object.entries(rooms)) {
    const allOff = room.fans.on === 0 && room.lights.on === 0;
    msg += `**${name}:** `;
    if (allOff) {
      msg += "All off ✅\n";
    } else {
      const parts = [];
      if (room.fans.on > 0) parts.push(`🌀 ${room.fans.on}/${room.fans.total} fans ON`);
      if (room.lights.on > 0) parts.push(`💡 ${room.lights.on}/${room.lights.total} lights ON`);
      msg += parts.join(", ") + "\n";
    }
  }

  return msg.trim();
}

/**
 * Format a single room status response.
 */
function formatRoom(data) {
  if (!data || !data.devices) return "Couldn't fetch room data right now 😔";

  const roomName = data.room || "Unknown Room";
  let msg = `🏠 **${roomName}**\n\n`;

  const fans = data.devices.filter((d) => d.type === "fan");
  const lights = data.devices.filter((d) => d.type === "light");

  msg += "**Fans:**\n";
  fans.forEach((f) => {
    const icon = f.status === "on" ? "🌀" : "⭕";
    const ago = getTimeAgo(f.lastChanged);
    msg += `${icon} ${f.name}: ${f.status.toUpperCase()} (${f.wattage}W) — changed ${ago}\n`;
  });

  msg += "\n**Lights:**\n";
  lights.forEach((l) => {
    const icon = l.status === "on" ? "💡" : "⭕";
    const ago = getTimeAgo(l.lastChanged);
    msg += `${icon} ${l.name}: ${l.status.toUpperCase()} (${l.wattage}W) — changed ${ago}\n`;
  });

  if (data.summary) {
    msg += `\n⚡ Room power: **${data.summary.watts}W** (${data.summary.on}/${data.summary.total} devices ON)`;
  }

  return msg.trim();
}

/**
 * Format a usage/power response.
 */
function formatUsage(data) {
  if (!data || !data.power) return "Couldn't fetch power data right now 😔";

  const { power, today } = data;

  let msg = "⚡ **Office Power Report**\n\n";
  msg += `Total power right now: **${power.total}W**\n`;

  if (power.byRoom) {
    msg += "\n**Per-room breakdown:**\n";
    for (const [roomId, room] of Object.entries(power.byRoom)) {
      msg += `• ${room.roomName}: ${room.watts}W (${room.onCount}/${room.totalCount} devices ON)\n`;
    }
  }

  if (today) {
    msg += `\n📊 Today's estimated usage: **${today.kwh} kWh**\n`;
    msg += `💰 Estimated cost: **৳${today.estimatedCost}** (at ৳${today.rate}/kWh)`;
  }

  return msg.trim();
}

/**
 * Format an alert notification.
 */
function formatAlert(alert) {
  return alert.message || `⚠️ Alert: ${alert.type} in ${alert.roomName || "the office"}`;
}

/**
 * Helper: convert a timestamp to "X min ago" format.
 */
function getTimeAgo(timestamp) {
  if (!timestamp) return "unknown";
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

module.exports = {
  initGemini,
  humanize,
  fallbackFormat,
};
