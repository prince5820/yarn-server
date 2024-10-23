import express from 'express';
import { Socket } from 'socket.io';
import { PATH_GENERATE_PDF, PATH_GET_TRANSACTION, PATH_GET_UNREAD_MESSAGES, PATH_GET_USERS, PATH_LOAD_INITIAL_MESSAGES, PATH_SEND_MESSAGES, PATH_SENT_PDF_IN_MAIL } from '../common/constants/routes';
import { generatePdf, getTransactionsByUser, getUnreadMessages, getUsers, loadMessages, markMessagesAsRead, sendMessage, sentPdfInMail, upload } from '../controllers/chat-controller';

const chatRouter = express.Router();
export const onlineUsers = new Map<string, string>();

chatRouter.get(PATH_GET_USERS, getUsers);
chatRouter.post(PATH_GENERATE_PDF, generatePdf);
chatRouter.post(PATH_SENT_PDF_IN_MAIL, sentPdfInMail);
chatRouter.post(PATH_GET_TRANSACTION, getTransactionsByUser);
chatRouter.post(PATH_LOAD_INITIAL_MESSAGES, loadMessages);
chatRouter.get(PATH_GET_UNREAD_MESSAGES, getUnreadMessages);


export default chatRouter;

export const chatRoutes = (io: any) => {
  io.on('connection', (socket: Socket) => {
    console.log('New client connected:', socket.id);
    chatRouter.post(PATH_SEND_MESSAGES, upload.single('file'), (req, res) => sendMessage(req, res, io));

    socket.on('userConnected', (userId: string) => {
      onlineUsers.set(socket.id, userId);
      io.emit('onlineUsers', Array.from(onlineUsers.values()));
    });

    socket.on('userLogout', (userId: string) => {
      for (let [socketId, id] of onlineUsers.entries()) {
        if (id === userId) {
          onlineUsers.delete(socketId);
          break;
        }
      }
      io.emit('onlineUsers', Array.from(onlineUsers.values()));
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      onlineUsers.delete(socket.id);
      io.emit('onlineUsers', Array.from(onlineUsers.values()));
    });

    socket.on('sendMessage', (data) => {
      io.emit('receiveMessage', data);
      io.emit('increaseUnreadCount', { senderId: data.senderId });
    })
    socket.on('markMessagesAsRead', markMessagesAsRead(socket, io));
  });
};