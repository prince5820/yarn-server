import mysql, { Connection } from "mysql";

const dbConnection: Connection = mysql.createConnection({
  host: 'bj4pcstpt5emmq5btlg8-mysql.services.clever-cloud.com',
  user: 'uguehyt6jxhmyfrd',
  password: '87Adyy1OtVcS6KsTBcdm',
  database: 'bj4pcstpt5emmq5btlg8',
  charset: 'utf8mb4'
});

export default dbConnection;