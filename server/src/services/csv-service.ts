import Papa from "papaparse";
import { EntityConfig } from "../shared/types";
import { validateRecordData } from "../shared/config-validator";
import { createRecord } from "./entity-service";

// ============================================================
// CSV Service — Parses CSV data, validates against entity
// schema, and batch-imports records.
// ============================================================

export interface CsvMapping {
  [csvColumn: string]: string; // csvColumn -> entityField
}

export interface CsvImportOptions {
  entityName: string;
  csvData: string;
  mapping: CsvMapping;
  userId?: string;
}

export interface CsvImportResult {
  totalRows: number;
  imported: number;
  skipped: number;
  errors: Array<{ row: number; field: string; message: string }>;
}

/**
 * Parse CSV headers from raw CSV text.
 */
export function parseCsvHeaders(csvData: string): string[] {
  const result = Papa.parse(csvData, {
    header: true,
    preview: 1,
  });

  return result.meta.fields || [];
}

/**
 * Parse and preview CSV data (first N rows).
 */
export function previewCsv(
  csvData: string,
  maxRows = 5
): { headers: string[]; rows: Record<string, string>[] } {
  const result = Papa.parse(csvData, {
    header: true,
    preview: maxRows,
    skipEmptyLines: true,
  });

  return {
    headers: result.meta.fields || [],
    rows: result.data as Record<string, string>[],
  };
}

/**
 * Import CSV data into an entity.
 * Maps CSV columns to entity fields, validates each row,
 * and creates records for valid rows.
 */
export async function importCsv(options: CsvImportOptions): Promise<CsvImportResult> {
  const { entityName, csvData, mapping, userId } = options;

  // Parse all CSV data
  const parseResult = Papa.parse(csvData, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h: string) => h.trim(),
  });

  if (parseResult.errors.length > 0) {
    // Report parse-level errors
    return {
      totalRows: 0,
      imported: 0,
      skipped: 0,
      errors: parseResult.errors.map((e, i) => ({
        row: e.row || i,
        field: "",
        message: `CSV parse error: ${e.message}`,
      })),
    };
  }

  const rows = parseResult.data as Record<string, string>[];
  const result: CsvImportResult = {
    totalRows: rows.length,
    imported: 0,
    skipped: 0,
    errors: [],
  };

  // Process each row
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowIndex = i + 2; // +2 because row 1 is headers, and 1-indexed

    try {
      // Map CSV columns to entity fields
      const mappedData: Record<string, unknown> = {};
      for (const [csvCol, entityField] of Object.entries(mapping)) {
        if (csvCol in row && entityField) {
          const value = row[csvCol];
          // Skip empty values
          if (value !== undefined && value !== null && value !== "") {
            mappedData[entityField] = value;
          }
        }
      }

      // Skip completely empty rows
      if (Object.keys(mappedData).length === 0) {
        result.skipped++;
        continue;
      }

      // Create record (validation happens inside createRecord)
      await createRecord(entityName, mappedData, userId);
      result.imported++;
    } catch (error: any) {
      result.skipped++;

      if (error.name === "ValidationError" && error.fieldErrors) {
        for (const [field, message] of Object.entries(error.fieldErrors)) {
          result.errors.push({
            row: rowIndex,
            field,
            message: message as string,
          });
        }
      } else {
        result.errors.push({
          row: rowIndex,
          field: "",
          message: error.message || "Unknown error",
        });
      }
    }
  }

  return result;
}
