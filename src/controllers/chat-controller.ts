// chat-controller.ts

import { Request, Response } from "express";
import fs from 'fs';
import { MysqlError } from "mysql";
import path from "path";
import PDFDocument from 'pdfkit';
import { Socket } from "socket.io";
import { USER } from "../common/constants/constant";
import { MESSAGE_INTERNAL_SERVER_ERROR, MESSAGE_NO_DATA_FOUND_GIVEN_DATA_RANGE, MESSAGE_SENT_MAIL_FAILURE, MESSAGE_SENT_MAIL_PDF_SUCCESS } from "../common/constants/message";
import { ChatResponse, RequestPayload } from "../common/types/chat-types";
import { MysqlResult } from "../common/types/mysql-result";
import { Payment } from "../common/types/payment-types";
import { User } from "../common/types/user-types";
import { convertArrayKeysToCamelCase, convertKeysToCamelCase } from "../common/utils/camelcase-converter";
import { formatDate } from "../common/utils/date-trimmer";
import transporter from "../config/mail-config";
import dbConnection from "../utils/db-connection";

export const getUsers = (req: Request, res: Response) => {
  dbConnection.query('SELECT * FROM is_user', (err: MysqlError | null, result: User[]) => {
    if (err) {
      return res.status(500).send(MESSAGE_INTERNAL_SERVER_ERROR);
    }

    const camelCaseResult = convertArrayKeysToCamelCase(result);
    res.status(200).send(camelCaseResult);
  });
}

export const loadMessages = (req: Request, res: Response) => {
  const { senderId, receiverId } = req.body;

  const sql = `
      SELECT id, message_text, DATE_FORMAT(message_date_time, '%Y-%m-%d %H:%i:%s') as message_date_time, sender_id, receiver_id, is_read, file_name, file_path, file_type
      FROM chat
      WHERE 
        (sender_id = ? AND receiver_id = ?) 
      OR 
        (sender_id = ? AND receiver_id = ?)
      ORDER BY message_date_time ASC;
    `;

  const values = [senderId, receiverId, receiverId, senderId];

  dbConnection.query(sql, values, async (err: MysqlError | null, results: ChatResponse[]) => {
    if (err) {
      console.error('Database error:', err);
      res.status(500).send(MESSAGE_INTERNAL_SERVER_ERROR);
      return;
    }

    const camelCaseResult = convertArrayKeysToCamelCase(results);

    const processedMessages = await Promise.all(
      camelCaseResult.map(async (message) => {
        if (message.fileName && message.filePath) {
          try {
            const fileBuffer = await fs.promises.readFile(message.filePath);
            return {
              ...message,
              fileData: fileBuffer.toString('base64'),
            };
          } catch (fileError) {
            console.error('Error reading file:', fileError);
            return message;
          }
        } else {
          return message;
        }
      })
    );

    res.status(200).send(processedMessages);
  });
};

export const getUnreadMessages = (req: Request, res: Response) => {
  const receiverId = req.params.receiverId;
  const unreadSql = `
      SELECT sender_id, COUNT(*) as unread_count 
      FROM chat 
      WHERE receiver_id = ? AND is_read = 0 
      GROUP BY sender_id`;

  dbConnection.query(unreadSql, [receiverId], (err: MysqlError | null, unreadResults: any[]) => {
    if (err) {
      console.log('Database error:', err);
      res.status(500).send(MESSAGE_INTERNAL_SERVER_ERROR);
      return;
    }

    const camelCaseResult = convertArrayKeysToCamelCase(unreadResults);
    res.status(200).send(camelCaseResult);
  });
};

export const sendMessage = (req: Request, res: Response, io: any) => {
  const { messageText, senderId, receiverId, file } = req.body;

  try {
    if (file) {
      const { fileName, fileType, fileData } = file;

      // Decode the base64 file data
      const buffer = Buffer.from(fileData, 'base64');

      // Define the upload path (e.g., './uploaded-files/')
      const uploadDir = path.resolve(__dirname, '../../../uploaded-files/');
      const newFileName = `${Date.now()}-${fileName}`;
      const filePath = path.join(uploadDir, newFileName);

      // Ensure the directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      fs.promises.writeFile(filePath, buffer).then(() => {
        //   3. Save file metadata to the database
        const fileSql = 'INSERT INTO chat (message_text, sender_id, receiver_id, file_name, file_path, file_type) VALUES (?, ?, ?, ?, ?, ?)';
        const fileValues = [null, senderId, receiverId, fileName, filePath, fileType];

        dbConnection.query(fileSql, fileValues, (err: MysqlError | null, result: MysqlResult) => {
          if (err) {
            console.log('Err', err);
            return res.status(500).send(MESSAGE_INTERNAL_SERVER_ERROR);
          }

          if (result) {
            const selectSql = `
            SELECT id, message_text, DATE_FORMAT(message_date_time, '%Y-%m-%d %H:%i:%s') as message_date_time, sender_id, receiver_id, is_read, file_name, file_path, file_type
            FROM chat 
            WHERE id = ?`;

            dbConnection.query(selectSql, [result.insertId], async (err: MysqlError | null, result: ChatResponse[]) => {
              if (err) {
                console.log('err', err);
                return res.status(500).send(MESSAGE_INTERNAL_SERVER_ERROR);
              }

              const newMessage = convertKeysToCamelCase(result[0]);
              const processedMessage = await Promise.all([
                (async () => {
                  if (newMessage.fileName && newMessage.filePath) {
                    try {
                      const fileBuffer = await fs.promises.readFile(newMessage.filePath);
                      return {
                        ...newMessage,
                        fileData: fileBuffer.toString('base64'),
                      };
                    } catch (fileError) {
                      console.error('Error reading file:', fileError);
                      return newMessage;
                    }
                  }
                  return newMessage;
                })()
              ]);
              res.status(200).send(processedMessage[0]);
              io.to(senderId.toString()).emit('receiveMessage', processedMessage[0]);
              io.to(receiverId.toString()).emit('receiveMessage', processedMessage[0]);

              io.to(receiverId.toString()).emit('increaseUnreadCount', { senderId });
            });
          }
        });
      })
    } else {
      if (messageText) {
        const fileSql = 'INSERT INTO chat (message_text, sender_id, receiver_id, file_name, file_path, file_type) VALUES (?, ?, ?, ?, ?, ?)';
        const fileValues = [messageText, senderId, receiverId, null, null, null];

        dbConnection.query(fileSql, fileValues, (err: MysqlError | null, result: MysqlResult) => {
          if (err) {
            console.log('Err', err);
            return res.status(500).send(MESSAGE_INTERNAL_SERVER_ERROR);
          }

          if (result) {
            const selectSql = `
                    SELECT id, message_text, DATE_FORMAT(message_date_time, '%Y-%m-%d %H:%i:%s') as message_date_time, sender_id, receiver_id, is_read, file_name, file_path, file_type
                    FROM chat 
                    WHERE id = ?`;

            dbConnection.query(selectSql, [result.insertId], (err: MysqlError | null, result: ChatResponse[]) => {
              if (err) {
                console.log('err', err);
                return res.status(500).send(MESSAGE_INTERNAL_SERVER_ERROR);
              }

              const newMessage = convertKeysToCamelCase(result[0]);
              res.status(200).send(newMessage);
              io.to(senderId.toString()).emit('receiveMessage', newMessage);
              io.to(receiverId.toString()).emit('receiveMessage', newMessage);

              io.to(receiverId.toString()).emit('increaseUnreadCount', { senderId });
            });
          }
        });
      }
    }
  } catch (err) {
    console.log('err in file saved', err);
  }
};

export const markMessagesAsRead = (socket: Socket, io: any) => {
  return ({ senderId, receiverId }: { senderId: number; receiverId: number }) => {
    const sql = `
      UPDATE chat
      SET is_read = 1
      WHERE sender_id = ? AND receiver_id = ? AND is_read = 0;
    `;

    dbConnection.query(sql, [senderId, receiverId], (err: MysqlError | null, result: any) => {
      if (err) {
        console.error('Error updating message status:', err);
      } else {
        console.log(`Messages from senderId ${senderId} marked as read.`);
      }
    });
  };
};

export const generatePdf = (req: Request, res: Response) => {
  const { startDate, endDate, senderId, user, selectedOption } = req.body;
  const receiverId = user.id;
  const userName = `${user.firstName} ${user.lastName}`;
  const formattedStartDate = formatDate(startDate);
  const formattedEndDate = formatDate(endDate);

  const sql = `
    SELECT *
    FROM chat 
    WHERE 
      message_date_time BETWEEN ? AND ?
    AND (
      (sender_id = ? AND receiver_id = ?) 
    OR 
      (sender_id = ? AND receiver_id = ?)
    );
  `;

  dbConnection.query(sql, [startDate, endDate, senderId, receiverId, receiverId, senderId], (err: MysqlError | null, result: any[]) => {
    if (err) {
      res.status(500).send(MESSAGE_INTERNAL_SERVER_ERROR);
      return;
    }

    if (result && result.length > 0) {
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4',
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment');

      doc.fontSize(20).text('Chat History', { align: 'center', underline: true });
      doc.moveDown(2); // Add space below the title

      doc.fontSize(14).text(`Username: ${userName}`, { align: 'left' });
      doc.moveDown(0.5);

      if (selectedOption === 'today') {
        doc.fontSize(10).text(`Chat Duration: ${formattedStartDate}`, { align: 'left' });
      } else {
        doc.fontSize(10).text(`Chat Duration: ${formattedStartDate} - ${formattedEndDate}`, { align: 'left' });
      }
      doc.moveDown(2);

      // Helper function to calculate height for multi-line messages
      const calculateMessageHeight = (text: string, width: number, fontSize: number) => {
        const tempDoc = new PDFDocument({ size: 'A4' });
        tempDoc.fontSize(fontSize);
        return tempDoc.heightOfString(text, { width });
      };

      // Loop through each message
      result.forEach((message, index) => {
        const { sender_id, receiver_id, message_text } = message;

        // Determine if the current message is from the sender or receiver
        const isSender = sender_id === senderId; // Assuming sender_id 4 is the current user (adjust as needed)
        const alignment = isSender ? 'right' : 'left';
        const backgroundColor = isSender ? '#D3FEDA' : '#F1F1F1'; // Green for sender, grey for receiver

        // Set the message box dimensions
        const textBoxWidth = 450; // Fixed width for messages
        const messageFontSize = 14;

        const textPositionX = isSender ? doc.page.width - doc.page.margins.right - textBoxWidth : doc.page.margins.left;

        // Calculate the height of the message (in case it's multi-line)
        const messageHeight = calculateMessageHeight(message_text, textBoxWidth, messageFontSize) + 20; // Adding padding

        // Check if the message will exceed the current page and handle page breaks
        if (doc.y + messageHeight > doc.page.height - doc.page.margins.bottom) {
          doc.addPage(); // Start a new page if needed
        }

        // Draw the background box for the message
        doc
          .roundedRect(textPositionX, doc.y, textBoxWidth, messageHeight, 6)
          .fill(backgroundColor)
          .stroke()
          .fillColor('black');

        // Draw the message text
        doc
          .fontSize(messageFontSize)
          .text(message_text, textPositionX + 10, doc.y + 10, {
            width: textBoxWidth - 20,
            align: alignment,
          })
          .moveDown(2); // Add space after each message
      });

      // Finalize the PDF and stream it in response
      doc.pipe(res);
      doc.end();
    } else {
      res.status(404).send(MESSAGE_NO_DATA_FOUND_GIVEN_DATA_RANGE);
    }
  });
};

export const sentPdfInMail = async (req: Request, res: Response) => {
  const { startDate, endDate, senderId, user, selectedOption } = req.body;
  const receiverId = user.id;
  const userName = `${user.firstName} ${user.lastName}`;
  const formattedStartDate = formatDate(startDate);
  const formattedEndDate = formatDate(endDate);
  let loggedInUserEmail: string;

  dbConnection.query('select * from is_user where id = ?', [senderId], (err: MysqlError | null, result: User[]) => {
    if (err) {
      res.status(500).send(MESSAGE_INTERNAL_SERVER_ERROR);
    }

    if (result) {
      loggedInUserEmail = result[0].email;
    }
  })

  const sql = `
    SELECT *
    FROM chat 
    WHERE 
      message_date_time BETWEEN ? AND ?
    AND (
      (sender_id = ? AND receiver_id = ?) 
    OR 
      (sender_id = ? AND receiver_id = ?)
    );
  `;

  dbConnection.query(sql, [startDate, endDate, senderId, receiverId, receiverId, senderId], (err: MysqlError | null, result: any[]) => {
    if (err) {
      res.status(500).send(MESSAGE_INTERNAL_SERVER_ERROR);
      return;
    }

    if (result && result.length > 0 && loggedInUserEmail) {
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4',
      });

      let buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers)); // Collect data as buffer
      doc.on('end', async () => {
        const pdfBuffer = Buffer.concat(buffers);

        try {
          await transporter.sendMail({
            from: USER,
            to: loggedInUserEmail,
            subject: 'Chat History',
            html: `You can find the chat history for <b>${userName}</b> from <b>${formattedStartDate}</b> to <b>${formattedEndDate}</b> attached as a PDF.`,
            attachments: [
              {
                filename: `${userName} - ${formattedStartDate} - ${formattedEndDate}.pdf`,
                content: pdfBuffer, // Use the PDF buffer as the attachment
                contentType: 'application/pdf',
              },
            ],
          });
          res.status(200).send(MESSAGE_SENT_MAIL_PDF_SUCCESS);
        } catch (mailErr) {
          res.status(500).send(MESSAGE_SENT_MAIL_FAILURE);
        }
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment');

      doc.fontSize(20).text('Chat History', { align: 'center', underline: true });
      doc.moveDown(2); // Add space below the title

      doc.fontSize(14).text(`Username: ${userName}`, { align: 'left' });
      doc.moveDown(0.5);

      if (selectedOption === 'today') {
        doc.fontSize(10).text(`Chat Duration: ${formattedStartDate}`, { align: 'left' });
      } else {
        doc.fontSize(10).text(`Chat Duration: ${formattedStartDate} - ${formattedEndDate}`, { align: 'left' });
      }
      doc.moveDown(2);

      // Helper function to calculate height for multi-line messages
      const calculateMessageHeight = (text: string, width: number, fontSize: number) => {
        const tempDoc = new PDFDocument({ size: 'A4' });
        tempDoc.fontSize(fontSize);
        return tempDoc.heightOfString(text, { width });
      };

      // Loop through each message
      result.forEach((message, index) => {
        const { sender_id, receiver_id, message_text } = message;

        // Determine if the current message is from the sender or receiver
        const isSender = sender_id === senderId; // Assuming sender_id 4 is the current user (adjust as needed)
        const alignment = isSender ? 'right' : 'left';
        const backgroundColor = isSender ? '#D3FEDA' : '#F1F1F1'; // Green for sender, grey for receiver

        // Set the message box dimensions
        const textBoxWidth = 450; // Fixed width for messages
        const messageFontSize = 14;

        const textPositionX = isSender ? doc.page.width - doc.page.margins.right - textBoxWidth : doc.page.margins.left;

        // Calculate the height of the message (in case it's multi-line)
        const messageHeight = calculateMessageHeight(message_text, textBoxWidth, messageFontSize) + 20; // Adding padding

        // Check if the message will exceed the current page and handle page breaks
        if (doc.y + messageHeight > doc.page.height - doc.page.margins.bottom) {
          doc.addPage(); // Start a new page if needed
        }

        // Draw the background box for the message
        doc
          .roundedRect(textPositionX, doc.y, textBoxWidth, messageHeight, 6)
          .fill(backgroundColor)
          .stroke()
          .fillColor('black');

        // Draw the message text
        doc
          .fontSize(messageFontSize)
          .text(message_text, textPositionX + 10, doc.y + 10, {
            width: textBoxWidth - 20,
            align: alignment,
          })
          .moveDown(2); // Add space after each message
      });

      doc.end();

    } else {
      res.status(404).send(MESSAGE_NO_DATA_FOUND_GIVEN_DATA_RANGE);
    }
  });
}

export const sentScheduleMail = async (onlineUsers: Set<string>) => {

  dbConnection.query('select * from is_user', async (err: MysqlError | null, result: User[]) => {
    if (err) {
      console.log(err);
    }

    if (result) {
      const userList = convertArrayKeysToCamelCase(result);
      const offlineUsers = userList.filter(user => !onlineUsers.has(user.id.toString()));

      offlineUsers.forEach((user) => {
        const sql = `SELECT 
          COUNT(c.id) AS unreadMessageCount,
          COUNT(DISTINCT c.sender_id) AS senderCount
        FROM chat c
        WHERE 
          c.receiver_id = ?
          AND c.is_read = 0;`

        dbConnection.query(sql, [user.id], (err: MysqlError | null, result) => {
          if (err) {
            console.log(err);
          }

          if (result) {
            const unreadData = result[0];
            if (unreadData.unreadMessageCount > 0) {
              const emailContent = `
              <h2>You have unread messages!</h2>
              <p>You have ${unreadData.unreadMessageCount} unread messages from ${unreadData.senderCount} users.</p>
              <p>Log in to your account to check them out.</p>
            `;

              transporter.sendMail({
                from: USER,
                to: user.email,
                subject: 'Unread Messages Notification',
                html: emailContent
              }).then((info) => {
                console.log(info.messageId);
              }).catch((mailErr) => {
                console.log(mailErr);
              })
            }
          }
        })
      })
    }
  })
}

export const getTransactionsByUser = (req: Request, res: Response) => {
  const { senderId, receiverId } = req.body;
  const sql = `SELECT id, title, description, type, amount, DATE_FORMAT(date, ' %Y-%m-%d') AS date, category_id, user_id, created_date, modified_date, split, split_user_id 
  FROM payment 
  WHERE 
  (user_id = ? AND split_user_id = ?)
  OR
  (user_id = ? AND split_user_id = ?)`
  const values = [senderId, receiverId, receiverId, senderId];

  dbConnection.query(sql, values, (err: MysqlError | null, result: Payment[]) => {
    if (err) {
      res.status(500).send(MESSAGE_INTERNAL_SERVER_ERROR);
    }

    const camelCaseResult = convertArrayKeysToCamelCase(result);
    res.status(200).send(camelCaseResult);
  })
}