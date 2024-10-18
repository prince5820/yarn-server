import { Request, Response } from "express";
import dbConnection from "../utils/db-connection";
import { MysqlError } from "mysql";
import { User, UserDetail } from "../common/types/user-types";
import { MysqlResult } from "../common/types/mysql-result";
import { MESSAGE_INTERNAL_SERVER_ERROR } from "../common/constants/message";
import { convertArrayKeysToCamelCase } from "../common/utils/camelcase-converter";

export const getUserById = (req: Request, res: Response) => {
  const userId = req.params.userId;

  dbConnection.query('SELECT * FROM is_user WHERE id = ? limit 1', [userId], (err: MysqlError | null, result: User[]) => {
    if (err) {
      res.status(500).send(MESSAGE_INTERNAL_SERVER_ERROR);
    }

    const camelCaseResult = convertArrayKeysToCamelCase(result);
    res.status(200).send(camelCaseResult);
  })
}

export const updateUser = (req: Request, res: Response) => {
  const userId = req.params.userId;
  const { firstName, lastName, email, gender, mobile, dob, profileUrl, address }: UserDetail = req.body;

  const sql = `
    UPDATE is_user 
    SET first_name = ?, 
        last_name = ?, 
        email = ?, 
        gender = ?, 
        mobile = ?, 
        dob = ?, 
        profile_url = ?, 
        address = ? 
    WHERE id = ?
  `;
  const values = [firstName, lastName, email, gender, mobile, dob, profileUrl || null, address, userId];

  dbConnection.query(sql, values, (err: MysqlError | null, result: MysqlResult) => {
    if (err) {
      return res.status(500).send(MESSAGE_INTERNAL_SERVER_ERROR);
    }

    res.status(201).send(result);
  })
}