import { Request, Response } from "express"
import dbConnection from "../utils/db-connection";
import { MysqlError } from "mysql";
import { MESSAGE_EMAIL_ALREADY_EXIST, MESSAGE_INTERNAL_SERVER_ERROR } from "../common/constants/message";
import { ContactRequestPayload, ContactResponse } from "../common/types/contact-types";
import { MysqlResult } from "../common/types/mysql-result";
import { convertArrayKeysToCamelCase } from "../common/utils/camelcase-converter";

export const getContactByUserId = (req: Request, res: Response) => {
  const userId = req.params.userId;

  dbConnection.query('select * from contact where user_id = ?', [userId], (err: MysqlError | null, result: ContactResponse[]) => {
    if (err) {
      res.status(500).send(MESSAGE_INTERNAL_SERVER_ERROR);
    }

    const camelCaseResult = convertArrayKeysToCamelCase(result);
    res.status(200).send(camelCaseResult);
  })
}

export const createContact = (req: Request, res: Response) => {
  const { firstName, lastName, mobile, email, profileUrl, active, userId }: ContactRequestPayload = req.body;

  dbConnection.query('select * from contact where email = ?', [email], (err: MysqlError | null, result: ContactResponse[]) => {
    if (err) {
      res.status(500).send(MESSAGE_INTERNAL_SERVER_ERROR);
    }

    if (result.length > 0) {
      return res.status(409).send(MESSAGE_EMAIL_ALREADY_EXIST);
    } else {
      const sql = 'insert into contact (first_name, last_name, mobile, email, profile_url, active, user_id) values (?, ?, ?, ?, ?, ?, ?)'
      const values = [firstName, lastName, mobile, email, profileUrl || null, active, userId]

      dbConnection.query(sql, values, (err: MysqlError | null, result: MysqlResult) => {
        if (err) {
          res.status(500).send(MESSAGE_INTERNAL_SERVER_ERROR);
        }

        res.status(201).send(result);
      })
    }
  })
}

export const editContact = (req: Request, res: Response) => {
  const contactId = req.params.contactId;
  const { firstName, lastName, mobile, email, profileUrl, active }: ContactRequestPayload = req.body;

  const sql = `update contact
  set first_name = ?,
  last_name = ?,
  mobile = ?,
  email = ?,
  profile_url = ?,
  active = ?
  where id = ?`
  const values = [firstName, lastName, mobile, email, profileUrl, active, contactId];

  dbConnection.query(sql, values, (err: MysqlError | null, result: MysqlResult) => {
    if (err) {
      res.status(500).send(MESSAGE_INTERNAL_SERVER_ERROR);
    }

    res.status(201).send(result);
  })
}

export const deleteContact = (req: Request, res: Response) => {
  const { contactId, userId } = req.params;

  dbConnection.query('delete from contact where id = ? and user_id = ?', [contactId, userId], (err: MysqlError | null, result) => {
    if (err) {
      res.status(500).send(MESSAGE_INTERNAL_SERVER_ERROR);
    }

    res.status(200).send(result);
  })
}