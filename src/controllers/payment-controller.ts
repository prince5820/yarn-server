import { Request, Response } from "express"
import { MysqlError } from "mysql"
import { MESSAGE_INTERNAL_SERVER_ERROR, MESSAGE_NO_DATA_FOUND_GIVEN_DATA_RANGE } from "../common/constants/message"
import { MysqlResult } from "../common/types/mysql-result"
import { Payment } from "../common/types/payment-types"
import { convertArrayKeysToCamelCase } from "../common/utils/camelcase-converter"
import dbConnection from "../utils/db-connection"
import PDFDocument from 'pdfkit';
import { User } from "../common/types/user-types"

export const getPaymentsByUserId = (req: Request, res: Response) => {
  const userId = req.params.userId
  const sql = `SELECT id, title, description, type, amount, DATE_FORMAT(date, ' %Y-%m-%d') AS date, category_id, user_id, created_date, modified_date, split, split_user_id FROM payment WHERE user_id = ?`

  dbConnection.query(sql, [userId], (err: MysqlError | null, result: Payment[]) => {
    if (err) {
      res.status(500).send(MESSAGE_INTERNAL_SERVER_ERROR)
    }

    const camelCaseResult = convertArrayKeysToCamelCase(result);
    res.status(200).send(camelCaseResult);
  })
}

export const createPayment = (req: Request, res: Response) => {
  const { title, description, type, amount, date, categoryId, userId, split, splitUserId } = req.body;
  const sql = 'insert into payment (title, description, type, amount, date, category_id, user_id, split, split_user_id) values (?, ?, ?, ?, ?, ?, ?, ?, ?)';
  const values = [title, description, type, amount, date, categoryId, userId, split, splitUserId];

  dbConnection.query(sql, values, (err: MysqlError | null, result: MysqlResult) => {
    if (err) {
      res.status(500).send(MESSAGE_INTERNAL_SERVER_ERROR);
    }

    res.status(201).send(result);
  })
}

export const updatePayment = (req: Request, res: Response) => {
  const paymentId = req.params.paymentId;
  const { title, description, type, amount, date, categoryId, userId, split, splitUserId } = req.body;
  const sql = `
  update payment
  set title = ?,
  description = ?,
  type = ?,
  amount = ?,
  date = ?,
  category_id = ?,
  user_id = ?,
  split = ?,
  split_user_id = ?
  where id = ?
  `
  const values = [title, description, type, amount, date, categoryId, userId, split, splitUserId, paymentId];

  dbConnection.query(sql, values, (err: MysqlError | null, result: MysqlResult) => {
    if (err) {
      res.status(500).send(MESSAGE_INTERNAL_SERVER_ERROR);
    }

    res.status(201).send(result);
  })
}

export const deletePayment = (req: Request, res: Response) => {
  const { userId, paymentId } = req.params;

  dbConnection.query('DELETE FROM payment WHERE id = ? AND user_id = ?', [paymentId, userId], (err: MysqlError | null, result: MysqlResult) => {
    if (err) {
      res.status(500).send(MESSAGE_INTERNAL_SERVER_ERROR);
    }

    res.status(200).send(result);
  })
}

export const analyzePayment = (req: Request, res: Response) => {
  const { startDate, endDate } = req.body;

  let startDateQuery = startDate;
  let endDateQuery = endDate;

  const fetchOldestAndNewestDate = `
    SELECT 
      MIN(DATE_FORMAT(date, '%Y-%m-%d')) as oldestDate, 
      MAX(DATE_FORMAT(date, '%Y-%m-%d')) as newestDate 
    FROM payment;
  `;

  dbConnection.query(fetchOldestAndNewestDate, (err: MysqlError | null, result) => {
    if (err) {
      return res.status(500).send(MESSAGE_INTERNAL_SERVER_ERROR);
    }

    const { oldestDate, newestDate } = result[0];

    if (!startDateQuery) {
      startDateQuery = oldestDate;
    }

    if (!endDateQuery) {
      endDateQuery = newestDate;
    }

    const sql = `SELECT id, title, description, type, amount, DATE_FORMAT(date, '%Y-%m-%d') AS date, 
    category_id, user_id, created_date, modified_date FROM payment WHERE date BETWEEN ? AND ?`;

    dbConnection.query(sql, [startDateQuery, endDateQuery], (err: MysqlError | null, result: Payment[]) => {
      if (err) {
        return res.status(500).send(MESSAGE_INTERNAL_SERVER_ERROR);
      }

      const camelCaseResult = convertArrayKeysToCamelCase(result);
      if (camelCaseResult.length > 0) {
        res.status(200).send(camelCaseResult);
      } else {
        res.status(404).send(MESSAGE_NO_DATA_FOUND_GIVEN_DATA_RANGE);
      }
    });
  });
};

export const downloadPdfPaymentData = (req: Request, res: Response) => {
  const { startDate, endDate, userId } = req.body;
  let userName: string;

  let startDateQuery = startDate;
  let endDateQuery = endDate;

  dbConnection.query('SELECT * FROM is_user WHERE id = ?', [userId], (err: MysqlError | null, result: User[]) => {
    if (err) {
      console.log(err);
    }

    const camelCaseResult = convertArrayKeysToCamelCase(result);
    if (camelCaseResult.length > 0) {
      userName = `${camelCaseResult[0].firstName} ${camelCaseResult[0].lastName}`;

      const fetchOldestAndNewestDate = `
    SELECT 
      MIN(DATE_FORMAT(date, '%Y-%m-%d')) as oldestDate, 
      MAX(DATE_FORMAT(date, '%Y-%m-%d')) as newestDate 
    FROM payment;
  `;

      dbConnection.query(fetchOldestAndNewestDate, (err: MysqlError | null, result) => {
        if (err) {
          return res.status(500).send(MESSAGE_INTERNAL_SERVER_ERROR);
        }

        const { oldestDate, newestDate } = result[0];

        if (!startDateQuery) {
          startDateQuery = oldestDate;
        }

        if (!endDateQuery) {
          endDateQuery = newestDate;
        }

        const sql = `SELECT id, title, description, type, amount, DATE_FORMAT(date, '%Y-%m-%d') AS date, 
    category_id, user_id, created_date, modified_date FROM payment WHERE date BETWEEN ? AND ?`;

        dbConnection.query(sql, [startDateQuery, endDateQuery], (err: MysqlError | null, result: Payment[]) => {
          if (err) {
            return res.status(500).send(MESSAGE_INTERNAL_SERVER_ERROR);
          }

          const camelCaseResult = convertArrayKeysToCamelCase(result);
          if (camelCaseResult.length > 0 && userName) {
            const doc = new PDFDocument({
              margin: 50,
              size: 'A4',
            });

            const fileName = `payment-history-${userName}-${startDateQuery}-${endDateQuery}`;

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
            res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

            let totalAmount = 0;

            doc.fontSize(20).text('Payment History', { align: 'center', underline: true });
            doc.moveDown(2);

            doc.fontSize(14).text(`Username: ${userName}`, { align: 'left' });
            doc.moveDown(0.5);

            doc.fontSize(10).text(`Duration: ${startDateQuery} - ${endDateQuery}`, { align: 'left' });
            doc.moveDown(2);

            camelCaseResult.forEach((payment) => {
              const amount = payment.amount;
              const isExpense = payment.type === 'expense';
              totalAmount += isExpense ? -amount : amount;

              doc.fontSize(14)
                .text(payment.title || '', { align: 'left', continued: true });

              doc.fillColor(isExpense ? 'red' : 'green')
                .text(`${payment.amount}`, { align: 'right' });

              doc.fillColor('black');

              doc.fontSize(10)
                .text(payment.date, { align: 'left' });

              doc.moveDown(2);
            });

            doc.moveDown(2);
            doc.fontSize(14)
              .text('Total Amount', { align: 'left', continued: true })
              .fillColor(totalAmount < 0 ? 'red' : 'green')
              .text(`${totalAmount}`, { align: 'right' });

            doc.end();
            doc.pipe(res);
          } else {
            res.status(404).send(MESSAGE_NO_DATA_FOUND_GIVEN_DATA_RANGE);
          }
        });
      });
    } else {
      res.status(404).send('User not found');
    }
  })
}