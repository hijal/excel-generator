const ExcelJS = require('exceljs');
const fs = require('fs');
const { Transform } = require('stream');

const numRows = 10 * 100000;
const chunkSize = 1000; // Number of rows to write in each chunk

// Create a new Excel workbook and worksheet
const workbook = new ExcelJS.Workbook();
const worksheet = workbook.addWorksheet('Sheet 1');

// Add headers to the worksheet
worksheet.addRow(['ID', 'Name', 'Email']);

class DataGeneratorStream extends Transform {
  constructor(options) {
    super(options);
    this.rowCount = 0;
  }

  _transform(chunk, encoding, callback) {
    // Generate and write data for the chunk
    for (let i = 1; i <= chunk; i++) {
      const row = [
        this.rowCount + i,
        `Name${this.rowCount + i}`,
        `email${this.rowCount + i}@example.com`
      ];
      worksheet.addRow(row);
    }

    this.rowCount += chunk;

    // Signal that the chunk has been processed
    callback();
  }
}

(async () => {
  // Create a write stream to write the Excel data to a file
  const excelFileName = '1M_Data_Stream.xlsx';
  const outputStream = fs.createWriteStream(excelFileName);

  // Create a data generator stream and pipe it to the output stream
  const dataGeneratorStream = new DataGeneratorStream({ objectMode: true });

  dataGeneratorStream.on('error', (error) => {
    console.error('Error generating data:', error);
  });

  outputStream.on('finish', () => {
    console.log(`Excel file "${excelFileName}" created successfully.`);
  });

  dataGeneratorStream.pipe(outputStream);

  // Generate data in chunks and send it to the data generator stream
  const totalChunks = Math.ceil(numRows / chunkSize);

  for (let chunk = 1; chunk <= totalChunks; chunk++) {
    dataGeneratorStream.write(chunkSize);
  }

  // End the data generator stream to finish the process
  dataGeneratorStream.end();

  // Wait for the workbook to be written before exiting
  await workbook.xlsx.writeFile(excelFileName);
})();
