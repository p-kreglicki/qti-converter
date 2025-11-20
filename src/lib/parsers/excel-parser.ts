import * as XLSX from 'xlsx';
import { FileParser, ParseResult, ParserOptions } from './types';

export class ExcelParser implements FileParser {
    async parse(file: File, options?: ParserOptions): Promise<ParseResult> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = e.target?.result;
                    const workbook = XLSX.read(data, { type: 'binary' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];

                    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                        header: options?.hasHeader ? undefined : 1 // undefined means use first row as keys
                    });

                    const questions = jsonData.map((row: any, index) => ({
                        id: `row-${index}`,
                        text: '',
                        type: 'multiple_choice' as const,
                        options: [],
                        correctAnswers: [],
                        metadata: {
                            raw: row
                        }
                    }));

                    resolve({
                        questions,
                        errors: [],
                        warnings: []
                    });
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = (error) => reject(error);
            reader.readAsBinaryString(file);
        });
    }
}
