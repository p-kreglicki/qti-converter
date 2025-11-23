import { QtiGenerator } from '../src/lib/export/qti-generator';
import { Question } from '../src/lib/db/types';
import { validateQTI } from './validate-qti';
import JSZip from 'jszip';
import { v4 as uuidv4 } from 'uuid';

async function testQtiGeneration() {
    console.log('🧪 Testing QTI Generation and Validation');
    console.log('═══════════════════════════════════════\n');

    // 1. Mock Data
    const mockQuestions: Question[] = [
        {
            id: uuidv4(),
            conversion_id: uuidv4(),
            question_text: 'What is the capital of France?',
            question_type: 'multiple_choice',
            answer_options: [
                { id: '1', text: 'London', is_correct: false },
                { id: '2', text: 'Berlin', is_correct: false },
                { id: '3', text: 'Paris', is_correct: true },
                { id: '4', text: 'Madrid', is_correct: false }
            ],
            correct_answer: 'Paris',
            explanation: 'Paris is the capital of France.',
            topic: 'Geography',
            difficulty: 'easy',
            blooms_level: 'remember',
            had_pii: false,
            pii_anonymized: false,
            pii_changes: [],
            quality_score: 100,
            quality_issues: [],
            ai_suggestions: null,
            original_row_number: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        },
        {
            id: uuidv4(),
            conversion_id: uuidv4(),
            question_text: 'True or False: The earth is flat.',
            question_type: 'true_false',
            answer_options: [
                { id: '1', text: 'True', is_correct: false },
                { id: '2', text: 'False', is_correct: true }
            ],
            correct_answer: 'False',
            explanation: 'The earth is an oblate spheroid.',
            topic: 'Science',
            difficulty: 'easy',
            blooms_level: 'remember',
            had_pii: false,
            pii_anonymized: false,
            pii_changes: [],
            quality_score: 100,
            quality_issues: [],
            ai_suggestions: null,
            original_row_number: 2,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }
    ];

    console.log(`📝 Generated ${mockQuestions.length} mock questions.`);

    // 2. Generate QTI Zip
    console.log('⚙️  Generating QTI Zip...');
    const generator = new QtiGenerator(mockQuestions);
    const zipBuffer = await generator.generate();
    console.log(`✅ Generated QTI Zip (${zipBuffer.length} bytes).`);

    // 3. Read Zip
    console.log('📂 Reading Zip content...');
    const zip = await JSZip.loadAsync(zipBuffer);

    const files = Object.keys(zip.files);
    console.log(`   Found ${files.length} files in zip:`);
    files.forEach(f => console.log(`   - ${f}`));

    // 4. Validate XMLs
    console.log('\n🔍 Validating XML files...');

    let allValid = true;

    for (const filename of files) {
        if (filename.endsWith('.xml')) {
            console.log(`\n   Validating ${filename}...`);
            const content = await zip.file(filename)?.async('string');

            if (!content) {
                console.error(`   ❌ Failed to read ${filename}`);
                allValid = false;
                continue;
            }

            // Skip manifest validation for now as our validator is for assessment items
            // But we can add basic check
            if (filename === 'imsmanifest.xml') {
                if (content.includes('<manifest') && content.includes('imsqti_item_xmlv2p1')) {
                    console.log('   ✅ Manifest looks valid (basic check)');
                } else {
                    console.error('   ❌ Manifest missing required elements');
                    allValid = false;
                }
                continue;
            }

            const result = await validateQTI(content);

            if (result.valid) {
                console.log('   ✅ Valid QTI Item');
            } else {
                console.log('   ❌ Invalid QTI Item');
                result.errors.forEach(e => console.log(`      - ${e}`));
                allValid = false;
            }
        }
    }

    console.log('\n═══════════════════════════════════════');
    if (allValid) {
        console.log('✅ TEST PASSED: All QTI files generated correctly.');
    } else {
        console.error('❌ TEST FAILED: Validation errors found.');
        process.exit(1);
    }
}

testQtiGeneration().catch(console.error);
