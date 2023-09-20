const ExcelJS = require('exceljs');
const fs = require('fs');
const { Transform } = require('stream');

const fetchUsersInChunks = require('./users');

const excelFileName = 'Users.xlsx';

// Create a new Excel workbook and worksheet
const workbook = new ExcelJS.Workbook();
const worksheet = workbook.addWorksheet('Users');

// Add headers to the worksheet
worksheet.addRow(['ID', 'Name', 'Username', 'Email', 'Phone']);

class DataGeneratorStream extends Transform {
  constructor(options, users) {
    super(options);
    this.rowCount = 0;
    this.users = users;
  }

  _transform(chunk, encoding, callback) {
    // Generate and write user data for the chunk
    for (let i = 0; i < chunk; i++) {
      if (this.rowCount < this.users.length) {
        const user = this.users[this.rowCount];
        const row = [user.id, user.name, user.username, user.email, user.phone];
        worksheet.addRow(row);
        this.rowCount++;
      } else {
        // If all user data has been written, signal the end of the stream
        this.push(null);
        break;
      }
    }

    // Signal that the chunk has been processed
    callback();
  }
}

(async () => {
  // Create a write stream to write the Excel data to a file
  const outputStream = fs.createWriteStream(excelFileName);

  const chunkSize = 1000; // chunk size as needed
  const users = await fetchUsersInChunks(chunkSize);
  // Generate data in chunks and send it to the data generator stream
  const totalChunks = Math.ceil(users.length / chunkSize);

  // Create a data generator stream and pipe it to the output stream
  const dataGeneratorStream = new DataGeneratorStream(
    { objectMode: true },
    users
  );

  dataGeneratorStream.on('error', (error) => {
    console.error('Error generating data:', error);
  });

  outputStream.on('finish', () => {
    console.log(`Excel file "${excelFileName}" created successfully.`);
  });

  dataGeneratorStream.pipe(outputStream);

  for (let chunk = 1; chunk <= totalChunks; chunk++) {
    dataGeneratorStream.write(chunkSize);
  }

  // End the data generator stream to finish the process
  dataGeneratorStream.end();

  // Wait for the workbook to be written before exiting
  await workbook.xlsx.writeFile(excelFileName);
})();
