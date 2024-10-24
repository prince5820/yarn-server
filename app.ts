import express from 'express'
import cors from 'cors';
import userRouter from './src/routes/user-routes';
import profileRouter from './src/routes/profile-routes';
import categoryRouter from './src/routes/category-routes';
import paymentRouter from './src/routes/payment-router';
import contactRouter from './src/routes/contact-routes';
import chatRouter, { chatRoutes, onlineUsers } from './src/routes/chat-routes';
import { createServer } from 'http';
import { initializeWebSocket } from './src/utils/web-socket';
import cron from 'node-cron';
import { sentScheduleMail } from './src/controllers/chat-controller';
import autoPayRouter from './src/routes/auto-pay-routes';
import dbConnection from './src/utils/db-connection';
import { MysqlError } from 'mysql';
import { Payment } from './src/common/types/payment-types';
import { convertArrayKeysToCamelCase } from './src/common/utils/camelcase-converter';
import { MysqlResult } from './src/common/types/mysql-result';
import path from 'path';

const app = express();
const server = createServer(app);
const io = initializeWebSocket(server);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ limit: '2mb', extended: true }));
app.use(cors({
  origin: 'https://talkwallet.netlify.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

app.options('*', cors());

app.use(userRouter);
app.use(profileRouter);
app.use(categoryRouter);
app.use(paymentRouter);
app.use(contactRouter);
app.use(chatRouter);
chatRoutes(io);
app.use(autoPayRouter);
app.use('/uploads', express.static(path.join('public/uploads')));

// cron.schedule('*/5 * * * *', () => {
//   console.log('sent unread messages mail');
//   sentScheduleMail(onlineUsers);
// })

const scheduledPayments = () => {
  dbConnection.query('select * from auto_pay', (err: MysqlError | null, result: Payment[]) => {
    if (err) {
      console.log('Error in auto payment', err);
    }

    const camelCaseResult = convertArrayKeysToCamelCase(result);
    if (camelCaseResult) {
      camelCaseResult.forEach((payment) => {
        const { title, description, type, amount, date, categoryId, userId, split, splitUserId } = payment;

        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;

        const formattedMonth = currentMonth < 10 ? `0${currentMonth}` : currentMonth;
        const formattedDay = date < 10 ? `0${date}` : date;

        const fullDate = `${currentYear}-${formattedMonth}-${formattedDay}`;

        const sql = 'insert into payment (title, description, type, amount, date, category_id, user_id, split, split_user_id) values (?, ?, ?, ?, ?, ?, ?, ?, ?)';
        const values = [title, description, type, amount, fullDate, categoryId, userId, split, splitUserId];

        cron.schedule(`5 0 ${date} * *`, () => {
          dbConnection.query(sql, values, (err: MysqlError | null, result: MysqlResult) => {
            if (err) {
              console.log('Error in clear auto payment', err);
            }

            console.log('Scheduled Payment sent', result);
          })
        })
      })
    }
  })
}

scheduledPayments();

export default server;