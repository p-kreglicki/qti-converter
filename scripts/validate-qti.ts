import { parseString } from 'xml2js';
import { readFileSync } from 'fs';
import { promisify } from 'util';
import JSZip from 'jszip';
import path from 'path';

const parseXML = promisify(parseString);

interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    info: {
        questionCount: number;
        questionTypes: string[];
        hasMetadata: boolean;
    };
}

/**
 * Validate QTI 2.1 XML structure (Assessment Item)
 */
async function validateAssessmentItemXML(xmlContent: string, filename: string): Promise<ValidationResult> {
    const result: ValidationResult = {
        valid: true,
        errors: [],
        warnings: [],
        info: {
            questionCount: 0,
            questionTypes: [],
            hasMetadata: false
        }
    };

    try {
        const parsed = await parseXML(xmlContent) as any;

        if (parsed.assessmentItem) {
            return validateAssessmentItem(parsed.assessmentItem, result);
        } else if (parsed.questestinterop) {
            result.warnings.push(`[${filename}] Detected QTI 1.2 format (questestinterop). This validator is optimized for QTI 2.1.`);
            result.errors.push(`[${filename}] Expected QTI 2.1 (assessmentItem) but found QTI 1.2 (questestinterop)`);
            result.valid = false;
            return result;
        } else if (parsed.manifest) {
            // It's a manifest, skip assessment validation or validate as manifest
            // But we shouldn't be calling this function for manifest if we can help it
            return result;
        } else {
            result.errors.push(`[${filename}] Unknown XML format. Missing assessmentItem root element.`);
            result.valid = false;
            return result;
        }

    } catch (error: any) {
        result.valid = false;
        result.errors.push(`[${filename}] XML parsing error: ${error.message}`);
        return result;
    }
}

function validateAssessmentItem(item: any, result: ValidationResult): ValidationResult {
    result.info.questionCount = 1;

    if (!item.$ || !item.$.identifier) {
        result.errors.push('assessmentItem missing identifier attribute');
        result.valid = false;
    }

    if (!item.$ || !item.$.title) {
        result.warnings.push('assessmentItem missing title attribute');
    }

    if (!item.responseDeclaration || item.responseDeclaration.length === 0) {
        result.errors.push('Missing responseDeclaration');
        result.valid = false;
    } else {
        const respDecl = item.responseDeclaration[0];
        if (!respDecl.correctResponse) {
            result.warnings.push('responseDeclaration missing correctResponse (scoring might be impossible)');
        }
    }

    if (!item.itemBody || item.itemBody.length === 0) {
        result.errors.push('Missing itemBody');
        result.valid = false;
        return result;
    }

    const body = item.itemBody[0];

    if (body.choiceInteraction) {
        result.info.questionTypes.push('multiple_choice');
        const interaction = body.choiceInteraction[0];

        if (!interaction.prompt) {
            result.warnings.push('choiceInteraction missing prompt');
        }

        if (!interaction.simpleChoice || interaction.simpleChoice.length === 0) {
            result.errors.push('choiceInteraction has no simpleChoice elements (answer options)');
            result.valid = false;
        }
    } else if (body.extendedTextInteraction) {
        result.info.questionTypes.push('essay');
    } else {
        // It might be just text or another interaction
        // result.warnings.push('No supported interaction type found');
    }

    return result;
}

async function validateManifest(xmlContent: string): Promise<ValidationResult> {
    const result: ValidationResult = {
        valid: true,
        errors: [],
        warnings: [],
        info: { questionCount: 0, questionTypes: [], hasMetadata: false }
    };

    try {
        const parsed = await parseXML(xmlContent) as any;
        if (!parsed.manifest) {
            result.errors.push('Root element is not <manifest>');
            result.valid = false;
        }
        // Basic manifest checks could go here
    } catch (e: any) {
        result.errors.push(`Manifest parsing error: ${e.message}`);
        result.valid = false;
    }
    return result;
}

/**
 * Validate QTI file or ZIP package
 */
async function validateQTIFile(filePath: string): Promise<void> {
    console.log('🔍 Validating:', filePath);
    console.log('');

    const isZip = filePath.toLowerCase().endsWith('.zip');

    if (isZip) {
        await validateZipPackage(filePath);
    } else {
        // Single XML file
        const xmlContent = readFileSync(filePath, 'utf-8');
        const result = await validateAssessmentItemXML(xmlContent, path.basename(filePath));
        printResults(result);
    }
}

async function validateZipPackage(filePath: string) {
    try {
        const data = readFileSync(filePath);
        const zip = await JSZip.loadAsync(data);

        const files = Object.keys(zip.files);
        console.log(`📦 ZIP contains ${files.length} files.`);

        let overallValid = true;
        let totalQuestions = 0;
        let allErrors: string[] = [];
        let allWarnings: string[] = [];

        // 1. Validate Manifest
        const manifestFile = files.find(f => f.endsWith('imsmanifest.xml'));
        if (manifestFile) {
            console.log('📄 Found imsmanifest.xml');
            const content = await zip.file(manifestFile)!.async('string');
            const res = await validateManifest(content);
            if (!res.valid) {
                overallValid = false;
                allErrors.push(...res.errors.map(e => `[Manifest] ${e}`));
            }
        } else {
            allWarnings.push('No imsmanifest.xml found in root');
        }

        // 2. Validate Assessment Items
        const xmlFiles = files.filter(f => f.endsWith('.xml') && !f.endsWith('imsmanifest.xml'));
        console.log(`📄 Found ${xmlFiles.length} potential assessment items.`);

        for (const file of xmlFiles) {
            const content = await zip.file(file)!.async('string');
            // Skip if it looks like a manifest but named differently, or other metadata
            if (content.includes('<manifest')) continue;

            const res = await validateAssessmentItemXML(content, file);
            if (res.valid) {
                if (res.info.questionCount > 0) totalQuestions += res.info.questionCount;
            } else {
                // Only count as error if it really looked like an assessment item but failed
                // If it was some other XML, maybe warning?
                // For now, report errors
                overallValid = false;
                allErrors.push(...res.errors);
            }
            allWarnings.push(...res.warnings.map(w => `[${file}] ${w}`));
        }

        console.log('');
        console.log('📊 Package Validation Results:');
        console.log('────────────────────────────');
        console.log(`Status: ${overallValid ? '✅ VALID' : '❌ INVALID'}`);
        console.log(`Total Questions Identified: ${totalQuestions}`);

        if (allErrors.length > 0) {
            console.log('');
            console.log('❌ Errors:');
            allErrors.forEach(e => console.log(`  - ${e}`));
        }

        if (allWarnings.length > 0) {
            console.log('');
            console.log('⚠️  Warnings:');
            allWarnings.forEach(w => console.log(`  - ${w}`));
        }

        if (!overallValid) process.exit(1);

    } catch (error: any) {
        console.error('❌ Error processing ZIP:', error.message);
        process.exit(1);
    }
}

function printResults(result: ValidationResult) {
    console.log('📊 Validation Results:');
    console.log('─────────────────────');
    console.log(`Status: ${result.valid ? '✅ VALID' : '❌ INVALID'}`);
    console.log('');

    console.log('📈 Information:');
    console.log(`  Questions: ${result.info.questionCount}`);
    console.log(`  Question Types: ${result.info.questionTypes.join(', ') || 'None detected'}`);
    console.log(`  Has Metadata: ${result.info.hasMetadata ? 'Yes' : 'No'}`);
    console.log('');

    if (result.errors.length > 0) {
        console.log('❌ Errors:');
        result.errors.forEach(err => console.log(`  - ${err}`));
        console.log('');
    }

    if (result.warnings.length > 0) {
        console.log('⚠️  Warnings:');
        result.warnings.forEach(warn => console.log(`  - ${warn}`));
        console.log('');
    }

    if (result.valid) {
        console.log('✅ QTI file is valid!');
    } else {
        console.log('❌ QTI file has validation errors.');
        process.exit(1);
    }
}

// Run validation if script is executed directly
if (require.main === module) {
    const filePath = process.argv[2];

    if (!filePath) {
        console.error('Usage: npx tsx scripts/validate-qti.ts <path-to-qti-file>');
        process.exit(1);
    }

    validateQTIFile(filePath);
}

export { validateAssessmentItemXML, validateQTIFile };
