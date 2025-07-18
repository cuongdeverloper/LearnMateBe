let users = [];

// Add a user to the users array
const addUser = (userId, socketId) => {
  !users.some((user) => user.userId === userId) &&
    users.push({ userId, socketId });
};

// Remove a user when they disconnect
const removeUser = (socketId) => {
  users = users.filter((user) => user.socketId !== socketId);
};

// Get a user by userId
const getUser = (userId) => {
  return users.find((user) => user.userId === userId);
};

const socketHandler = (io) => {

  io.on("connection", (socket) => {

    // Add user to the users list when they log in
    socket.on("addUser", (userId) => {
      addUser(userId, socket.id);
      io.emit("getUsers", users); // Emit all users to all clients
    });

    // Handle sending a message
    socket.on("sendMessage", ({ senderId, receiverId, text,conversationId  }) => {
      const user = getUser(receiverId); 
      if (user) {
        io.to(user.socketId).emit("getMessage", {  // Emit message to receiver's socket
          senderId,
          text,
          conversationId,
        });
      }
    });

    // Remove user when they disconnect
    socket.on("disconnect", () => {
      removeUser(socket.id);
      io.emit("getUsers", users);  // Emit updated users list to all clients
    });
    socket.on("seenMessage", ({ senderId, conversationId }) => {
      const user = getUser(senderId);
      if (user) {
        io.to(user.socketId).emit("messageSeen", { conversationId });
      }
    });
  });
};

module.exports = socketHandler;
