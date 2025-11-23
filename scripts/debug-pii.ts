import { RegexPIIDetector } from '../src/lib/pii/regex-detector';

async function debugPII() {
    const detector = new RegexPIIDetector();

    const testCases = [
        {
            id: 'Question 4',
            text: 'Dr. Smith diagnosed the patient at 123 Medical Way. Beta blockers Antibiotics Insulin Chemotherapy'
        },
        {
            id: 'Question 6',
            text: 'Please contact support at 555-0199 for assistance. 555 019 199 999'
        }
    ];

    console.log('🔍 Debugging PII Detection');
    console.log('══════════════════════════');

    for (const test of testCases) {
        console.log(`\nTesting ${test.id}:`);
        console.log(`Input: "${test.text}"`);

        const result = await detector.detect(test.text);

        console.log('Result:', JSON.stringify(result, null, 2));

        if (result.hasPII) {
            console.log('✅ PII Detected');
            result.entities.forEach(e => console.log(`   - ${e.type}: "${e.value}"`));
        } else {
            console.log('❌ NO PII Detected');
        }
    }
}

debugPII().catch(console.error);
