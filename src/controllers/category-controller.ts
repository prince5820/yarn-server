import { Request, Response } from "express";
import dbConnection from "../utils/db-connection";
import { MysqlError } from "mysql";
import { Category } from "../common/types/category-types";
import { MysqlResult } from "../common/types/mysql-result";
import { MESSAGE_CATEGORY_NAME_ALREADY_EXIST, MESSAGE_INTERNAL_SERVER_ERROR, MESSAGE_SHORT_NAME_ALREADY_EXIST } from '../common/constants/message';
import { convertArrayKeysToCamelCase } from "../common/utils/camelcase-converter";

export const getCategoriesByUserId = (req: Request, res: Response) => {
  const userId = req.params.userId;

  dbConnection.query('SELECT * FROM category WHERE user_id = ?', [userId], (err: MysqlError | null, result: Category[]) => {
    if (err) {
      res.status(500).send(MESSAGE_INTERNAL_SERVER_ERROR);
    }

    const camelCaseResult = convertArrayKeysToCamelCase(result);
    res.status(200).send(camelCaseResult);
  })
}

export const createCategory = (req: Request, res: Response) => {
  const { userId, categoryName, shortName }: Category = req.body;

  const checkSql = 'SELECT * FROM category WHERE category_name = ? OR short_name = ?';
  const checkValues = [categoryName, shortName];

  dbConnection.query(checkSql, checkValues, (err: MysqlError | null, result: Category[]) => {
    if (err) {
      return res.status(500).send(MESSAGE_INTERNAL_SERVER_ERROR);
    }

    if (result.length > 0) {
      const camelCaseResult = convertArrayKeysToCamelCase(result);
      const existingCategory = camelCaseResult.find(row => row.categoryName === categoryName);
      const existingShortName = camelCaseResult.find(row => row.shortName === shortName);

      if (existingCategory) {
        return res.status(409).send(MESSAGE_CATEGORY_NAME_ALREADY_EXIST);
      }

      if (existingShortName) {
        return res.status(409).send(MESSAGE_SHORT_NAME_ALREADY_EXIST);
      }
    }

    const insertSql = 'INSERT INTO category (user_id, category_name, short_name) VALUES (?, ?, ?)';
    const insertValues = [userId, categoryName, shortName];

    dbConnection.query(insertSql, insertValues, (err: MysqlError | null, result: MysqlResult) => {
      if (err) {
        return res.status(500).send(MESSAGE_INTERNAL_SERVER_ERROR);
      }

      res.status(201).send(result);
    });
  });
}

export const updateCategory = (req: Request, res: Response) => {
  const categoryId = req.params.categoryId;
  const { userId, categoryName, shortName }: Category = req.body;

  const checkSql = 'SELECT * FROM category WHERE (category_name = ? OR short_name = ?) AND id != ?';
  const checkValues = [categoryName, shortName, categoryId];

  dbConnection.query(checkSql, checkValues, (err: MysqlError | null, result: Category[]) => {
    if (err) {
      return res.status(500).send(MESSAGE_INTERNAL_SERVER_ERROR);
    }

    if (result.length > 0) {
      const camelCaseResult = convertArrayKeysToCamelCase(result);
      const existingCategory = camelCaseResult.find(row => row.categoryName === categoryName);
      const existingShortName = camelCaseResult.find(row => row.shortName === shortName);

      if (existingCategory > 1) {
        return res.status(409).send(MESSAGE_CATEGORY_NAME_ALREADY_EXIST);
      }

      if (existingShortName > 1) {
        return res.status(409).send(MESSAGE_SHORT_NAME_ALREADY_EXIST);
      }
    }

    const sql = `
    UPDATE category
    SET category_name = ?,
    short_name = ?
    WHERE id = ? AND
    user_id = ?
  `;
    const values = [categoryName, shortName, categoryId, userId];

    dbConnection.query(sql, values, (err: MysqlError | null, result: MysqlResult) => {
      if (err) {
        return res.status(500).send(MESSAGE_INTERNAL_SERVER_ERROR);
      }

      res.status(201).send(result);
    })
  });
}

export const deleteCategory = (req: Request, res: Response) => {
  const { userId, categoryId } = req.params;

  dbConnection.query('DELETE FROM category WHERE id = ? AND user_id = ?', [categoryId, userId], (err: MysqlError | null, result: MysqlResult) => {
    if (err) {
      res.status(500).send(MESSAGE_INTERNAL_SERVER_ERROR);
    }

    res.status(200).send(result);
  })
}