import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { AIPIIDetector } from '../src/lib/pii/ai-detector';

// Load env vars from .env.local
dotenv.config({ path: '.env.local' });

async function runTest() {
    const filePath = path.join(process.cwd(), 'test_data', 'sample_ai_pii.txt');
    console.log(`Reading file: ${filePath}`);

    const text = fs.readFileSync(filePath, 'utf-8');
    console.log('--- Original Content ---');
    console.log(text);
    console.log('------------------------');

    if (!process.env.ANTHROPIC_API_KEY) {
        console.error('Error: ANTHROPIC_API_KEY not found in .env.local');
        process.exit(1);
    }

    const detector = new AIPIIDetector();
    console.log('Running AI PII detection (this may take a few seconds)...');

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
