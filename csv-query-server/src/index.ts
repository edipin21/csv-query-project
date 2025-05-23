import express, { Request, Response } from "express";
import { parse } from "csv-parse/sync";
import alasql from "alasql";
import cors from "cors";
import https from "https";
import http from "http";

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const cache: Record<string, { records: any[]; timestamp: number }> = {};
const CACHE_DURATION_MS = 5 * 60 * 1000;
const TABLE_NAME = "data";
const MAX_FILE_SIZE_IN_MB = 10;

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of Object.entries(cache)) {
    if (now - entry.timestamp > CACHE_DURATION_MS) {
      delete cache[key];
      console.log(`Cache expired and removed for key: ${key}`);
    }
  }
}, 5 * 60 * 1000);

app.get("/", (req: Request, res: Response) => {
  res.send("The server is running.");
});

app.post("/run-query", async (req, res) => {
  const { csvUrl, query } = req.body;

  try {
    const validation = validateInputs(csvUrl, query);
    if (!validation.isValid) {
      res
        .status(400)
        .json({ error: validation.errors.csvUrl ?? validation.errors.query });
      return;
    }
    await checkFileSize(csvUrl);

    const records = await getCachedOrFreshRecords(csvUrl);

    loadTable(TABLE_NAME, records);

    const result = alasql(query) as Record<string, any>[];

    checkForUndefinedResults(result, records);

    res.status(200).json({
      columns: Object.keys(result[0] || {}),
      rows: result,
    });
  } catch (e: any) {
    if (e.message.includes("larger than the allowed maximum size")) {
      res.status(413).json({ error: e.message });
      return;
    }
    if (e.message.includes("Failed to fetch CSV")) {
      res.status(404).json({ error: e.message });
      return;
    }

    if (
      e.message === "Failed to parse CSV." ||
      e.message.includes("Query executed, but no matching columns")
    ) {
      res.status(400).json({ error: e.message });
      return;
    }

    res.status(500).json({ error: e.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

////////////////////////////Helper functions////////////////////////////

function cleanCsvText(rawCsv: string): string {
  const lines = rawCsv.trim().split(/\r?\n/);
  if (lines.length === 0) return rawCsv;

  const headerLine = lines[0];

  const cleanedHeaders = headerLine
    .split(",")
    .map((h) => h.replace(/"/g, "").trim())
    .map((h) => `"${h}"`)
    .join(",");

  return [cleanedHeaders, ...lines.slice(1)].join("\n");
}

export async function fetchAndParseCsv(csvUrl: string): Promise<any[]> {
  const response = await fetch(csvUrl);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch CSV from URL: ${csvUrl}, Status: ${response.status}`
    );
  }

  const csvText = await response.text();
  const cleanedCsv = cleanCsvText(csvText);

  try {
    return parse(cleanedCsv, {
      columns: true,
      skip_empty_lines: true,
      relax_quotes: true,
      trim: true,
    });
  } catch {
    throw new Error("Failed to parse CSV.");
  }
}

export async function getCachedOrFreshRecords(csvUrl: string): Promise<any[]> {
  const now = Date.now();
  const cacheEntry = cache[csvUrl];
  const isCached = cacheEntry && now - cacheEntry.timestamp < CACHE_DURATION_MS;

  if (isCached) {
    return Promise.resolve(cacheEntry.records);
  }

  return fetchAndParseCsv(csvUrl).then((records) => {
    cache[csvUrl] = { records, timestamp: now };
    return records;
  });
}

export function loadTable(tableName: string, records: any[]): void {
  alasql(`DROP TABLE IF EXISTS ${tableName}`);
  alasql(`CREATE TABLE ${tableName}`);

  if (!alasql.tables[tableName]) {
    throw new Error("Failed to create table");
  }

  alasql.tables[tableName].data = records;
}

export function checkForUndefinedResults(result: any[], records: any[]) {
  const hasOnlyUndefined = result.every((row) =>
    Object.values(row).every((value) => value === undefined)
  );

  if (result.length > 0 && hasOnlyUndefined) {
    const existingColumns = Object.keys(records[0] || {});
    throw new Error(
      `Query executed, but no matching columns were found. Make sure your column names are correct. Available columns: [${existingColumns.join(
        ", "
      )}]`
    );
  }
}
export interface ValidationResult {
  isValid: boolean;
  errors: {
    csvUrl?: string;
    query?: string;
  };
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function validateInputs(csvUrl?: string, query?: string): ValidationResult {
  const errors: ValidationResult["errors"] = {};

  if (!csvUrl) {
    errors.csvUrl = "CSV URL is required.";
  } else if (!isValidUrl(csvUrl)) {
    errors.csvUrl = "Invalid URL.";
  }

  if (!query) {
    errors.query = "SQL query is required.";
  } else if (!query.toLowerCase().startsWith("select")) {
    errors.query = "Query must start with SELECT.";
  } else if (!query.toLowerCase().includes("from data")) {
    errors.query = "Query must include 'from data' clause.";
  } else if (!/\bfrom data\b(?!\S)/i.test(query)) {
    errors.query = "Query must include 'from data' as a standalone phrase.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
function getFileSize(csvUrl: string): Promise<number> {
  return new Promise((resolve, reject) => {
    try {
      const url = new URL(csvUrl);
      const protocol = url.protocol === "https:" ? https : http;

      protocol
        .request(
          {
            method: "HEAD",
            hostname: url.hostname,
            path: url.pathname,
            headers: {},
          },
          (response) => {
            const contentLength = response.headers["content-length"];
            if (contentLength) {
              resolve(parseInt(contentLength, 10));
            } else {
              reject(new Error("Could not retrieve content-length"));
            }
          }
        )
        .on("error", (err) => reject(err))
        .end();
    } catch (err) {
      reject(err);
    }
  });
}

async function checkFileSize(csvUrl: string): Promise<void> {
  try {
    const fileSize = await getFileSize(csvUrl);

    const fileSizeInMB = fileSize / (1024 * 1024);

    if (fileSizeInMB > MAX_FILE_SIZE_IN_MB) {
      throw new Error(
        `The file at the provided URL is larger than the allowed maximum size of ${MAX_FILE_SIZE_IN_MB} MB. The file size is: ${fileSizeInMB.toFixed(
          2
        )} MB`
      );
    }
  } catch (error: any) {
    throw error;
  }
}
