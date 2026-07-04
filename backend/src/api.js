const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
app.get("/api/health", (req, res) => res.json({ ok: true }));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  console.log("client connected:", socket.id);
});

const PORT = 4000;
server.listen(PORT, () => console.log(`Backend running on :${PORT}`));
