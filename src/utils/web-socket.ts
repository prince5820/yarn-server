import { Server } from "socket.io";

export const initializeWebSocket = (server: any) => {
  const io = new Server(server, {
    cors: {
      origin: ['http://localhost:5173', 'https://talkwallet.netlify.app'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true
    },
  });
  return io;
};