import { Request, Response } from "express";
import dbConnection from "../utils/db-connection";
import { MysqlError } from "mysql";
import { User, UserDetail } from "../common/types/user-types";
import { MysqlResult } from "../common/types/mysql-result";
import generator from 'generate-password';
import transporter from "../config/mail-config";
import { USER } from "../common/constants/constant";
import { MESSAGE_EMAIL_ALREADY_EXIST, MESSAGE_INTERNAL_SERVER_ERROR, MESSAGE_PASSWORD_RESET_SUCCESS, MESSAGE_USER_NOT_EXIST, MESSAGE_USER_NOT_FOUND } from "../common/constants/message";
import { convertArrayKeysToCamelCase } from "../common/utils/camelcase-converter";

export const signIn = (req: Request, res: Response) => {
  const email = req.params.email;
  dbConnection.query('select * from is_user where email = ? limit 1', [email], (err: MysqlError | null, result: User[]) => {
    if (err) {
      res.status(500).send(MESSAGE_INTERNAL_SERVER_ERROR);
    }

    if (result.length > 0) {
      const camelCaseResult = convertArrayKeysToCamelCase(result);
      res.status(200).send(camelCaseResult);
    } else {
      res.status(404).send(MESSAGE_USER_NOT_EXIST);
    }
  })
}

export const signUp = (req: Request, res: Response) => {
  const { firstName, lastName, email, password, gender, mobile, dob, profileUrl, address }: UserDetail = req.body;
  const userEmail = email;

  dbConnection.query('SELECT * FROM is_user where email = ?', [userEmail], (err: MysqlError | null, result: User[]) => {
    if (err) {
      return res.status(500).send(MESSAGE_INTERNAL_SERVER_ERROR);
    }

    if (result.length > 0) {
      return res.status(409).send(MESSAGE_EMAIL_ALREADY_EXIST);
    } else {
      const sql = 'INSERT INTO is_user (first_name, last_name, email, password, gender, mobile, dob, profile_url, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
      const values = [firstName, lastName, email, password, gender, mobile, dob, profileUrl || null, address];

      dbConnection.query(sql, values, (err: MysqlError | null, result: MysqlResult) => {
        if (err) {
          return res.status(500).send(MESSAGE_INTERNAL_SERVER_ERROR);
        }

        res.status(201).send(result);
      })
    }
  })
}

export const forgetPassword = (req: Request, res: Response) => {
  const email: string = req.params.email;

  dbConnection.query('SELECT * FROM is_user where email = ?', [email], (err: MysqlError | null, result: User[]) => {
    if (err) {
      return res.status(500).send(MESSAGE_INTERNAL_SERVER_ERROR);
    }

    if (result.length > 0) {
      const password = generator.generate({
        length: 10,
        numbers: true
      });

      if (password) {
        dbConnection.query('UPDATE is_user SET password = ? where email = ?', [password, email], (err: MysqlError | null, result: MysqlResult) => {
          if (err) {
            return res.status(500).send(MESSAGE_INTERNAL_SERVER_ERROR);
          }

          if (result) {
            transporter.sendMail({
              from: USER,
              to: email,
              subject: 'Forgot-password',
              html: `Your new Password is <b>${password}</b>`
            }).then((info) => {
              res.status(200).send(MESSAGE_PASSWORD_RESET_SUCCESS);
            }).catch((mailErr) => {
              res.status(500).send(MESSAGE_INTERNAL_SERVER_ERROR);
            })
          }
        })
      }
    } else {
      res.status(404).send(MESSAGE_USER_NOT_FOUND);
    }
  })
}