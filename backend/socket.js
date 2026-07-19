const { Server } = require('socket.io');

let io;

module.exports = {
  initSocket: (httpServer) => {
    io = new Server(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST']
      }
    });

    io.on('connection', (socket) => {
      // Socket connected (debug logging suppressed in production)
      
      socket.on('join_user_room', (userId) => {
        socket.join(`user_${userId}`);
      });
      
      socket.on('disconnect', () => {
      });
    });

    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error('Socket.io not initialized!');
    }
    return io;
  }
};
