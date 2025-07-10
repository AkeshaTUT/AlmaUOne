import express from "express";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import path from "path";

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer);

const rooms = new Map<string, string[]>();

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

io.on("connection", (socket) => {
  socket.on("join-room", ({ roomId }) => {
    if (!rooms.has(roomId)) rooms.set(roomId, []);
    const peers = rooms.get(roomId)!;

    peers.forEach(peerId => {
      io.to(peerId).emit("add-peer", { peerId: socket.id, shouldCreateOffer: false });
      socket.emit("add-peer", { peerId, shouldCreateOffer: true });
    });

    peers.push(socket.id);
    socket.join(roomId);
    (socket as any).roomId = roomId;
  });

  socket.on("relay-sdp", ({ peerId, sessionDescription }) => {
    io.to(peerId).emit("session-description", { peerId: socket.id, sessionDescription });
  });

  socket.on("relay-ice", ({ peerId, iceCandidate }) => {
    io.to(peerId).emit("ice-candidate", { peerId: socket.id, iceCandidate });
  });

  socket.on("chat-message", ({ roomId, message }) => {
    socket.to(roomId).emit("chat-message", { sender: socket.id, message });
  });

  socket.on("disconnect", () => {
    const roomId = (socket as any).roomId;
    if (!roomId) return;
    const peers = rooms.get(roomId) || [];
    rooms.set(roomId, peers.filter(id => id !== socket.id));
    peers.forEach(peerId => {
      io.to(peerId).emit("remove-peer", { peerId: socket.id });
    });
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}); 