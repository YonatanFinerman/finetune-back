const express = require('express');
const app = express();
const port = process.env.PORT || 3001;
const fs = require('fs');
const csv = require('csv-parser');
const mysql = require('mysql2');
const cors = require('cors');

app.use(express.json());

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'a24c35',
  database: 'tunes_db',
};

const connection = mysql.createConnection(dbConfig);

const createBandsTableQuery = `
  CREATE TABLE IF NOT EXISTS tunes_table (
    song_name VARCHAR(50),
    band VARCHAR(50),
    year INT,
    img_url VARCHAR(2048)
  )
`;

const createTunesDbQuery = `
  CREATE DATABASE IF NOT EXISTS tunes_db
`;


const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true,
};

app.use(cors(corsOptions));


connection.query(createTunesDbQuery, (err, results) => {
  if (err) {
    console.error('Error creating tunes_db database:', err);
  } else {
    console.log('tunes_db database created successfully');

    const dbSpecificConfig = {
      ...dbConfig,
      database: 'tunes_db',
    };
    const newConnection = mysql.createConnection(dbSpecificConfig);

    newConnection.query(createBandsTableQuery, (err, results) => {
      if (err) {
        console.error('Error creating tunes_table table:', err);
      } else {
        console.log('tunes_table table created successfully');


        importCsvToSql(newConnection);
      }

    });
  }
});

async function importCsvToSql(newConnection) {
  try {
  
    fs.createReadStream('./F-S Test - T02 - 2023 - Song_list (1).csv')
      .pipe(csv({ separator: ';' })) 
      .on('data', (row) => {
       
        newConnection.execute(
          'INSERT INTO tunes_table (song_name, band, year) VALUES (?, ?, ?)',
          [row['Song Name'], row['Band'], row['Year']],
          (err, results) => {
            if (err) {
              console.error('Error inserting data:', err);
            } else {
              console.log('Inserted:', results.affectedRows);
            }
          }
        );
      })
      .on('end', () => {
        console.log('CSV file successfully processed');

      
        newConnection.end();
      });
  } catch (error) {
    console.error('Error:', error);
  }
}


app.get('/tune', (req, res) => {
  
  connection.query('SELECT * FROM tunes_table', (err, results) => {
    if (err) {
      console.error('Error retrieving data:', err);
      res.status(500).json({ error: 'Error retrieving data' });
    } else {
     
    
      res.json(results);
    }
  });
});

app.get('/', async (req, res) => {
  res.send('Hello, World!');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});





