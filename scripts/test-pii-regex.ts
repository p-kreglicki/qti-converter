import fs from 'fs';
import path from 'path';
import { RegexPIIDetector } from '../src/lib/pii/regex-detector';

async function runTest() {
    const filePath = path.join(process.cwd(), 'test_data', 'sample_pii.csv');
    console.log(`Reading file: ${filePath}`);

    const text = fs.readFileSync(filePath, 'utf-8');
    console.log('File content length:', text.length);
    console.log('--- Original Content Preview ---');
    console.log(text.slice(0, 200) + '...');
    console.log('--------------------------------');

    const detector = new RegexPIIDetector();
    console.log('Running PII detection...');

    const result = await detector.detect(text);

    console.log('\n--- Detection Results ---');
    console.log(`Has PII: ${result.hasPII}`);
    console.log(`Total Entities Found: ${result.entities.length}`);

    console.log('\n--- Entities ---');
    result.entities.forEach((entity, index) => {
        console.log(`${index + 1}. [${entity.type}] ${entity.value} (Confidence: ${entity.confidence})`);
    });

    console.log('\n--- Redacted Text Preview ---');
    console.log(result.redactedText);
}

runTest().catch(console.error);
