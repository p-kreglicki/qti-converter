import { CSVParser } from './csv-parser';
import { ExcelParser } from './excel-parser';
import { FileParser } from './types';

export * from './types';
export * from './csv-parser';
export * from './excel-parser';

export function getParserForFile(file: File): FileParser {
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'csv') {
        return new CSVParser();
    }

    if (['xlsx', 'xls'].includes(extension || '')) {
        return new ExcelParser();
    }

    throw new Error(`Unsupported file extension: ${extension}`);
}
