import mysql, { Pool } from "mysql";

const dbConnection: Pool = mysql.createPool({
  connectionLimit: 10, // Number of connections in the pool
  host: 'bj4pcstpt5emmq5btlg8-mysql.services.clever-cloud.com',
  user: 'uguehyt6jxhmyfrd',
  password: '87Adyy1OtVcS6KsTBcdm',
  database: 'bj4pcstpt5emmq5btlg8',
  charset: 'utf8mb4'
});

export default dbConnection;