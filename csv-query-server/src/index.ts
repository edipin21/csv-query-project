
import cors from 'cors';
import duckdb from 'duckdb';
import express, { Request, Response } from 'express';
import { validateInputs } from './validate.js';


const app = express();
const port = 3000;


app.use(cors());

app.use(express.json());

app.post('/run-query', async (req: Request, res: Response): Promise<void> => {
    const db = new duckdb.Database(':memory:');
    const { csvUrl, query } = req.body;
    try {

        const validation = validateInputs(csvUrl, query);
        if (!validation.isValid) {
            res.status(400).json({ error: validation.errors.csvUrl ?? validation.errors.query });
            return;
        }


        const createTableQuery = `CREATE TABLE data AS SELECT * FROM read_csv_auto('${csvUrl}')`;
        await createTable(db, createTableQuery);


        const result = await runQuery(db, query);

        const sanitizedResult = sanitizeResult(result);
        res.status(200).json({
            columns: Object.keys(sanitizedResult[0] || {}),
            rows: sanitizedResult,
        });

    } catch (error: any) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});


function createTable(db: duckdb.Database, query: string): Promise<void> {
    return new Promise((resolve, reject) => {
        db.run(query, (err) => {
            if (err) {
                reject(new Error('Failed to create table: ' + err.message));
            } else {
                resolve();
            }
        });
    });
}


function runQuery(db: duckdb.Database, query: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
        db.all(query, (err, result) => {
            if (err) {
                reject(new Error('Query failed: ' + err.message));
            } else {
                resolve(result);
            }
        });
    });
}


function sanitizeResult(result: any[]) {
    return result.map(row =>
        Object.fromEntries(
            Object.entries(row).map(([key, value]) => [
                key,
                typeof value === 'bigint' ? value.toString() : value
            ])
        )
    );
}


