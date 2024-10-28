import mysql, { Connection } from "mysql";

let dbConnection: Connection | null = null;

const handleDisconnect = () => {
  dbConnection = mysql.createConnection({
    host: 'bj4pcstpt5emmq5btlg8-mysql.services.clever-cloud.com',
    user: 'uguehyt6jxhmyfrd',
    password: '87Adyy1OtVcS6KsTBcdm',
    database: 'bj4pcstpt5emmq5btlg8',
    charset: 'utf8mb4'
  });

  dbConnection.connect(err => {
    if (err) {
      console.error('Error connecting to database:', err);
      setTimeout(handleDisconnect, 2000); // Retry after 2 seconds
    }
  });

  // Use a non-null assertion to assure TypeScript that dbConnection is assigned
  dbConnection.on('error', err => {
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      handleDisconnect(); // Reconnect on connection loss
    } else {
      throw err;
    }
  });
}

handleDisconnect();

export default dbConnection!;