import JSZip from 'jszip';
import { Question } from '@/lib/db/types';
import { ASSESSMENT_ITEM_TEMPLATE, MANIFEST_TEMPLATE, SIMPLE_CHOICE_TEMPLATE } from './qti-templates';
import { v4 as uuidv4 } from 'uuid';

export class QtiGenerator {
    private questions: Question[];
    private zip: JSZip;

    constructor(questions: Question[]) {
        this.questions = questions;
        this.zip = new JSZip();
    }

    public async generate(): Promise<Buffer> {
        const resourceEntries: string[] = [];

        for (const question of this.questions) {
            const itemId = `question-${question.id}`;
            const fileName = `${itemId}.xml`;
            const xmlContent = this.generateAssessmentItem(question, itemId);

            this.zip.file(fileName, xmlContent);

            resourceEntries.push(
                `<resource identifier="RES-${itemId}" type="imsqti_item_xmlv2p1" href="${fileName}">
                    <file href="${fileName}"/>
                </resource>`
            );
        }

        const manifestContent = MANIFEST_TEMPLATE
            .replace('{{UUID}}', uuidv4())
            .replace('{{RESOURCES}}', resourceEntries.join('\n    '));

        this.zip.file('imsmanifest.xml', manifestContent);

        return await this.zip.generateAsync({ type: 'nodebuffer' });
    }

    private generateAssessmentItem(question: Question, itemId: string): string {
        let simpleChoices = '';
        let correctResponseId = '';

        if (question.answer_options) {
            simpleChoices = question.answer_options.map((option, index) => {
                const choiceId = `CHOICE_${index}`;
                if (option.is_correct) {
                    correctResponseId = choiceId;
                }
                return SIMPLE_CHOICE_TEMPLATE
                    .replace('{{CHOICE_ID}}', choiceId)
                    .replace('{{CHOICE_TEXT}}', this.escapeXml(option.text));
            }).join('\n      ');
        }

        // Fallback if no correct answer marked (shouldn't happen in valid data but good for safety)
        if (!correctResponseId && question.answer_options && question.answer_options.length > 0) {
            // Try to match by text if correct_answer field is set
            if (question.correct_answer) {
                const correctIndex = question.answer_options.findIndex(o => o.text === question.correct_answer || o.id === question.correct_answer); // id check might be needed if we store IDs
                if (correctIndex >= 0) correctResponseId = `CHOICE_${correctIndex}`;
            }
        }

        return ASSESSMENT_ITEM_TEMPLATE
            .replace('{{ITEM_ID}}', itemId)
            .replace('{{TITLE}}', this.escapeXml(question.question_text.substring(0, 50))) // Short title
            .replace('{{QUESTION_TEXT}}', this.escapeXml(question.question_text))
            .replace('{{CORRECT_RESPONSE_ID}}', correctResponseId)
            .replace('{{SIMPLE_CHOICES}}', simpleChoices);
    }

    private escapeXml(unsafe: string): string {
        return unsafe.replace(/[<>&'"]/g, (c) => {
            switch (c) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case '\'': return '&apos;';
                case '"': return '&quot;';
                default: return c;
            }
        });
    }
}
