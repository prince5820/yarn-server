import { Request, Response } from "express";
import dbConnection from "../utils/db-connection";
import { MysqlError } from "mysql";
import { MysqlResult } from "../common/types/mysql-result";
import { MESSAGE_INTERNAL_SERVER_ERROR } from "../common/constants/message";
import { Payment } from "../common/types/payment-types";
import { convertArrayKeysToCamelCase } from "../common/utils/camelcase-converter";

export const getAutoPayByUserId = (req: Request, res: Response) => {
  const userId = req.params.userId
  const sql = `SELECT * FROM auto_pay WHERE user_id = ?`

  dbConnection.query(sql, [userId], (err: MysqlError | null, result: Payment[]) => {
    if (err) {
      res.status(500).send(MESSAGE_INTERNAL_SERVER_ERROR)
    }

    const camelCaseResult = convertArrayKeysToCamelCase(result);
    res.status(200).send(camelCaseResult);
  })
}

export const getAutoPayByPaymentId = (req: Request, res: Response) => {
  const paymentId = req.params.paymentId
  const sql = `SELECT * FROM auto_pay WHERE id = ?`

  dbConnection.query(sql, [paymentId], (err: MysqlError | null, result: Payment[]) => {
    if (err) {
      res.status(500).send(MESSAGE_INTERNAL_SERVER_ERROR)
    }

    const camelCaseResult = convertArrayKeysToCamelCase(result);
    res.status(200).send(camelCaseResult);
  })
}

export const addAutoPay = (req: Request, res: Response) => {
  const { title, description, type, amount, date, categoryId, userId, split, splitUserId } = req.body;
  const sql = 'insert into auto_pay (title, description, type, amount, date, category_id, user_id, split, split_user_id) values (?, ?, ?, ?, ?, ?, ?, ?, ?)';
  const values = [title, description, type, amount, date, categoryId, userId, split, splitUserId];

  dbConnection.query(sql, values, (err: MysqlError | null, result: MysqlResult) => {
    if (err) {
      res.status(500).send(MESSAGE_INTERNAL_SERVER_ERROR);
    }

    res.status(201).send(`Your payment scheduled on ${date} of every month`);
  })
}

export const updateAutoPay = (req: Request, res: Response) => {
  const paymentId = req.params.paymentId;
  const { title, description, type, amount, date, categoryId, userId, split, splitUserId } = req.body;
  const sql = `
  update auto_pay
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

export const deleteAutoPay = (req: Request, res: Response) => {
  const { userId, paymentId } = req.params;

  dbConnection.query('DELETE FROM auto_pay WHERE id = ? AND user_id = ?', [paymentId, userId], (err: MysqlError | null, result: MysqlResult) => {
    if (err) {
      res.status(500).send(MESSAGE_INTERNAL_SERVER_ERROR);
    }

    res.status(200).send(result);
  })
}