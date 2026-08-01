import * as ExcelJS from 'exceljs';

export interface ExcelPreview {
  headers: string[];
  data: Record<string, any>[];
  totalRows: number;
}

export interface ValidationRule {
  columnName: string;
  columnLetter: string;
  dataType: 'text' | 'number' | 'date' | 'boolean';
  required?: boolean;
  minValue?: number;
  maxValue?: number;
  maxLength?: number;
  format?: string;
  uniqueValues?: boolean;
}

export interface ValidationError {
  row: number;
  column: string;
  value: any;
  error: string;
  rule: string;
}

export class ExcelValidatorService {
  async getPreview(filePath: string, startRow: number = 1, maxRows: number = 10): Promise<ExcelPreview> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.getWorksheet(1);

    if (!worksheet) throw new Error('No worksheet found');

    const headers: string[] = [];
    const data: Record<string, any>[] = [];

    // Get headers from first row
    worksheet.getRow(startRow).eachCell((cell, colNum) => {
      headers.push(cell.value?.toString() || `Column ${String.fromCharCode(64 + colNum)}`);
    });

    // Get data rows (preview only)
    for (let i = startRow + 1; i <= Math.min(worksheet.rowCount, startRow + maxRows); i++) {
      const row: Record<string, any> = {};
      const wsRow = worksheet.getRow(i);

      wsRow.eachCell((cell, colNum) => {
        row[headers[colNum - 1]] = cell.value;
      });

      data.push(row);
    }

    return {
      headers,
      data,
      totalRows: worksheet.rowCount - (startRow - 1)
    };
  }

  async validateFile(
    filePath: string,
    rules: ValidationRule[],
    startRow: number = 1
  ): Promise<ValidationError[]> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.getWorksheet(1);

    if (!worksheet) throw new Error('No worksheet found');

    const errors: ValidationError[] = [];
    const seenValues = new Map<string, Set<any>>();

    // Initialize unique value tracking
    rules.forEach(rule => {
      if (rule.uniqueValues) {
        seenValues.set(rule.columnName, new Set());
      }
    });

    // Validate each row
    for (let rowNum = startRow + 1; rowNum <= worksheet.rowCount; rowNum++) {
      const row = worksheet.getRow(rowNum);

      rules.forEach((rule) => {
        const cellIndex = this.columnLetterToNumber(rule.columnLetter);
        const cell = row.getCell(cellIndex);
        const value = cell.value;

        // Check required
        if (rule.required && (value === null || value === undefined || value === '')) {
          errors.push({
            row: rowNum,
            column: rule.columnName,
            value: value,
            error: 'This field is required',
            rule: 'required'
          });
          return;
        }

        if (value === null || value === undefined || value === '') {
          return;
        }

        // Check data type
        if (!this.validateType(value, rule.dataType)) {
          errors.push({
            row: rowNum,
            column: rule.columnName,
            value: value,
            error: `Expected ${rule.dataType}, got ${typeof value}`,
            rule: 'data_type'
          });
          return;
        }

        // Check range (for numbers)
        if (rule.dataType === 'number') {
          const numValue = Number(value);
          if (rule.minValue !== undefined && numValue < rule.minValue) {
            errors.push({
              row: rowNum,
              column: rule.columnName,
              value: value,
              error: `Must be >= ${rule.minValue}`,
              rule: 'min_value'
            });
          }
          if (rule.maxValue !== undefined && numValue > rule.maxValue) {
            errors.push({
              row: rowNum,
              column: rule.columnName,
              value: value,
              error: `Must be <= ${rule.maxValue}`,
              rule: 'max_value'
            });
          }
        }

        // Check length (for text)
        if (rule.dataType === 'text' && rule.maxLength) {
          const strValue = String(value);
          if (strValue.length > rule.maxLength) {
            errors.push({
              row: rowNum,
              column: rule.columnName,
              value: value,
              error: `Maximum length is ${rule.maxLength}, got ${strValue.length}`,
              rule: 'max_length'
            });
          }
        }

        // Check format (regex)
        if (rule.format) {
          const regex = new RegExp(rule.format);
          if (!regex.test(String(value))) {
            errors.push({
              row: rowNum,
              column: rule.columnName,
              value: value,
              error: `Does not match required format`,
              rule: 'format'
            });
          }
        }

        // Check unique
        if (rule.uniqueValues) {
          const uniqueSet = seenValues.get(rule.columnName);
          if (uniqueSet && uniqueSet.has(value)) {
            errors.push({
              row: rowNum,
              column: rule.columnName,
              value: value,
              error: `Duplicate value found`,
              rule: 'unique'
            });
          } else {
            uniqueSet?.add(value);
          }
        }
      });
    }

    return errors;
  }

  private validateType(value: any, expectedType: string): boolean {
    switch (expectedType) {
      case 'number':
        return !isNaN(Number(value)) && Number(value).toString() !== 'NaN';
      case 'text':
        return typeof value === 'string' || value instanceof String;
      case 'date':
        return value instanceof Date || !isNaN(Date.parse(String(value)));
      case 'boolean':
        return typeof value === 'boolean' || ['true', 'false'].includes(String(value).toLowerCase());
      default:
        return true;
    }
  }

  private columnLetterToNumber(letter: string): number {
    return letter.charCodeAt(0) - 64;
  }

  private numberToColumnLetter(num: number): string {
    return String.fromCharCode(64 + num);
  }
}

export const excelValidator = new ExcelValidatorService();
