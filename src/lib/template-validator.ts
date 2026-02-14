import type { TemplateJSON, TemplateValidationResult, TemplateValidationError, ExamType } from './types';

const VALID_EXAM_TYPES: ExamType[] = ['JEE', 'NEET', 'BOARDS', 'CUSTOM'];
const VALID_ICONS = [
    'Book', 'Zap', 'FlaskConical', 'Sigma', 'GraduationCap', 
    'Atom', 'Microscope', 'Calculator', 'Brain', 'Target',
    'Trophy', 'Award', 'Star', 'Bookmark', 'Library',
    'School', 'University', 'Pencil', 'Pen', 'Highlighter'
];
const VALID_PRIORITIES = ['Low', 'Medium', 'High'];

export function validateTemplateJSON(jsonString: string): TemplateValidationResult {
    const errors: TemplateValidationError[] = [];
    let data: any;
    
    // Step 1: Parse JSON
    try {
        data = JSON.parse(jsonString);
    } catch (parseError: any) {
        // Try to provide helpful error message
        const message = parseError.message || 'Invalid JSON syntax';
        const lineMatch = message.match(/position (\d+)/);
        const line = lineMatch ? estimateLineNumber(jsonString, parseInt(lineMatch[1])) : undefined;
        
        return {
            isValid: false,
            errors: [{
                field: 'root',
                message: `JSON Parse Error: ${message}. Check for missing commas, quotes, or brackets.`,
                severity: 'error',
                line,
            }],
        };
    }
    
    // Step 2: Validate root structure
    if (typeof data !== 'object' || data === null) {
        return {
            isValid: false,
            errors: [{
                field: 'root',
                message: 'Template must be a JSON object, not an array or primitive',
                severity: 'error',
            }],
        };
    }
    
    // Step 3: Validate required fields
    validateRequiredField(data, 'name', 'string', errors);
    validateRequiredField(data, 'examType', 'string', errors);
    validateRequiredField(data, 'subjects', 'array', errors);
    
    // Step 4: Validate field values
    if (data.name !== undefined) {
        if (data.name.length < 3) {
            errors.push({
                field: 'name',
                message: 'Template name must be at least 3 characters long',
                severity: 'error',
            });
        }
        if (data.name.length > 100) {
            errors.push({
                field: 'name',
                message: 'Template name must not exceed 100 characters',
                severity: 'error',
            });
        }
    }
    
    if (data.examType !== undefined) {
        if (!VALID_EXAM_TYPES.includes(data.examType)) {
            errors.push({
                field: 'examType',
                message: `Invalid examType "${data.examType}". Must be one of: ${VALID_EXAM_TYPES.join(', ')}`,
                severity: 'error',
            });
        }
    }
    
    // Step 5: Validate optional fields
    if (data.description !== undefined && typeof data.description !== 'string') {
        errors.push({
            field: 'description',
            message: 'Description must be a string',
            severity: 'warning',
        });
    }
    
    if (data.class !== undefined) {
        if (typeof data.class !== 'number' || ![11, 12].includes(data.class)) {
            errors.push({
                field: 'class',
                message: 'Class must be 11 or 12',
                severity: 'error',
            });
        }
    }
    
    if (data.icon !== undefined && !VALID_ICONS.includes(data.icon)) {
        errors.push({
            field: 'icon',
            message: `Invalid icon "${data.icon}". Using default "Book" instead.`,
            severity: 'warning',
        });
    }
    
    // Step 6: Validate subjects array
    if (Array.isArray(data.subjects)) {
        if (data.subjects.length === 0) {
            errors.push({
                field: 'subjects',
                message: 'Template must have at least one subject',
                severity: 'error',
            });
        }
        
        data.subjects.forEach((subject: any, index: number) => {
            validateSubject(subject, index, errors);
        });
    }
    
    // Step 7: Validate defaultTodos
    if (data.defaultTodos !== undefined) {
        if (!Array.isArray(data.defaultTodos)) {
            errors.push({
                field: 'defaultTodos',
                message: 'defaultTodos must be an array',
                severity: 'error',
            });
        } else {
            data.defaultTodos.forEach((todo: any, index: number) => {
                validateTodo(todo, index, errors);
            });
        }
    }
    
    // Step 8: Check for extra fields (warnings)
    const allowedFields = ['name', 'description', 'examType', 'class', 'icon', 'subjects', 'defaultTodos'];
    Object.keys(data).forEach(key => {
        if (!allowedFields.includes(key)) {
            errors.push({
                field: key,
                message: `Unknown field "${key}" will be ignored during import`,
                severity: 'warning',
            });
        }
    });
    
    const isValid = !errors.some(e => e.severity === 'error');
    
    return {
        isValid,
        errors,
        data: isValid ? (data as TemplateJSON) : undefined,
    };
}

function validateSubject(subject: any, index: number, errors: TemplateValidationError[]) {
    const prefix = `subjects[${index}]`;
    
    if (typeof subject !== 'object' || subject === null) {
        errors.push({
            field: prefix,
            message: `Subject ${index + 1} must be an object`,
            severity: 'error',
        });
        return;
    }
    
    // Required subject fields
    if (!subject.name || typeof subject.name !== 'string') {
        errors.push({
            field: `${prefix}.name`,
            message: `Subject ${index + 1} must have a name`,
            severity: 'error',
        });
    }
    
    if (!subject.icon || typeof subject.icon !== 'string') {
        errors.push({
            field: `${prefix}.icon`,
            message: `Subject ${index + 1} must have an icon. Valid icons: ${VALID_ICONS.slice(0, 5).join(', ')}...`,
            severity: 'error',
        });
    }
    
    // Validate chapters
    if (!Array.isArray(subject.chapters)) {
        errors.push({
            field: `${prefix}.chapters`,
            message: `Subject "${subject.name || index + 1}" must have a chapters array`,
            severity: 'error',
        });
    } else if (subject.chapters.length === 0) {
        errors.push({
            field: `${prefix}.chapters`,
            message: `Subject "${subject.name || index + 1}" must have at least one chapter`,
            severity: 'error',
        });
    } else {
        subject.chapters.forEach((chapter: any, chapIndex: number) => {
            validateChapter(chapter, chapIndex, prefix, subject.name, errors);
        });
    }
    
    // Validate tasks (optional)
    if (subject.tasks !== undefined && !Array.isArray(subject.tasks)) {
        errors.push({
            field: `${prefix}.tasks`,
            message: `Subject "${subject.name || index + 1}" tasks must be an array of strings`,
            severity: 'warning',
        });
    }
}

function validateChapter(
    chapter: any, 
    index: number, 
    subjectPrefix: string, 
    subjectName: string,
    errors: TemplateValidationError[]
) {
    const prefix = `${subjectPrefix}.chapters[${index}]`;
    
    if (typeof chapter !== 'object' || chapter === null) {
        errors.push({
            field: prefix,
            message: `Chapter ${index + 1} in "${subjectName}" must be an object`,
            severity: 'error',
        });
        return;
    }
    
    // Required chapter fields
    if (!chapter.name || typeof chapter.name !== 'string') {
        errors.push({
            field: `${prefix}.name`,
            message: `Chapter ${index + 1} in "${subjectName}" must have a name`,
            severity: 'error',
        });
    }
    
    // Validate lectureCount
    if (chapter.lectureCount === undefined) {
        errors.push({
            field: `${prefix}.lectureCount`,
            message: `Chapter "${chapter.name || index + 1}" in "${subjectName}" must have lectureCount`,
            severity: 'error',
        });
    } else if (typeof chapter.lectureCount !== 'number') {
        errors.push({
            field: `${prefix}.lectureCount`,
            message: `Chapter "${chapter.name || index + 1}" lectureCount must be a number`,
            severity: 'error',
        });
    } else if (chapter.lectureCount < 1 || chapter.lectureCount > 50) {
        errors.push({
            field: `${prefix}.lectureCount`,
            message: `Chapter "${chapter.name || index + 1}" lectureCount must be between 1 and 50`,
            severity: 'error',
        });
    }
    
    // Validate syllabus (optional but recommended)
    if (chapter.syllabus !== undefined) {
        if (!Array.isArray(chapter.syllabus)) {
            errors.push({
                field: `${prefix}.syllabus`,
                message: `Chapter "${chapter.name || index + 1}" syllabus must be an array`,
                severity: 'warning',
            });
        } else {
            chapter.syllabus.forEach((topic: any, topicIndex: number) => {
                validateTopic(topic, topicIndex, prefix, chapter.name, errors);
            });
        }
    } else {
        errors.push({
            field: `${prefix}.syllabus`,
            message: `Chapter "${chapter.name || index + 1}" has no detailed syllabus (optional but recommended)`,
            severity: 'warning',
        });
    }
}

function validateTopic(
    topic: any,
    index: number,
    chapterPrefix: string,
    chapterName: string,
    errors: TemplateValidationError[]
) {
    const prefix = `${chapterPrefix}.syllabus[${index}]`;
    
    if (typeof topic !== 'object' || topic === null) {
        errors.push({
            field: prefix,
            message: `Topic ${index + 1} in "${chapterName}" must be an object`,
            severity: 'error',
        });
        return;
    }
    
    if (!topic.name || typeof topic.name !== 'string') {
        errors.push({
            field: `${prefix}.name`,
            message: `Topic ${index + 1} in "${chapterName}" must have a name`,
            severity: 'error',
        });
    }
    
    if (topic.completed !== undefined && typeof topic.completed !== 'boolean') {
        errors.push({
            field: `${prefix}.completed`,
            message: `Topic "${topic.name || index + 1}" completed must be true or false`,
            severity: 'warning',
        });
    }
}

function validateTodo(todo: any, index: number, errors: TemplateValidationError[]) {
    const prefix = `defaultTodos[${index}]`;
    
    if (typeof todo !== 'object' || todo === null) {
        errors.push({
            field: prefix,
            message: `Todo ${index + 1} must be an object`,
            severity: 'error',
        });
        return;
    }
    
    if (!todo.text || typeof todo.text !== 'string') {
        errors.push({
            field: `${prefix}.text`,
            message: `Todo ${index + 1} must have text`,
            severity: 'error',
        });
    }
    
    if (todo.priority !== undefined && !VALID_PRIORITIES.includes(todo.priority)) {
        errors.push({
            field: `${prefix}.priority`,
            message: `Todo ${index + 1} priority must be one of: ${VALID_PRIORITIES.join(', ')}`,
            severity: 'warning',
        });
    }
}

function validateRequiredField(
    data: any,
    field: string,
    expectedType: string,
    errors: TemplateValidationError[]
) {
    if (data[field] === undefined) {
        errors.push({
            field,
            message: `Missing required field: "${field}"`,
            severity: 'error',
        });
        return;
    }
    
    const actualType = Array.isArray(data[field]) ? 'array' : typeof data[field];
    
    if (actualType !== expectedType) {
        errors.push({
            field,
            message: `Field "${field}" must be of type ${expectedType}, got ${actualType}`,
            severity: 'error',
        });
    }
}

function estimateLineNumber(jsonString: string, position: number): number {
    let line = 1;
    for (let i = 0; i < position && i < jsonString.length; i++) {
        if (jsonString[i] === '\n') line++;
    }
    return line;
}

// Auto-fix common JSON issues
export function autoFixJSON(jsonString: string): { fixed: string; changes: string[] } {
    let fixed = jsonString;
    const changes: string[] = [];
    
    // Fix 1: Remove trailing commas
    const trailingCommaRegex = /,(\s*[}\]])/g;
    if (trailingCommaRegex.test(fixed)) {
        fixed = fixed.replace(trailingCommaRegex, '$1');
        changes.push('Removed trailing commas');
    }
    
    // Fix 2: Fix single quotes to double quotes
    const singleQuoteRegex = /'([^']*)':/g;
    if (singleQuoteRegex.test(fixed)) {
        fixed = fixed.replace(singleQuoteRegex, '"$1":');
        changes.push('Converted single quotes to double quotes for keys');
    }
    
    // Fix 3: Fix unquoted keys
    const unquotedKeyRegex = /(\s*)(\w+)(\s*):/g;
    if (unquotedKeyRegex.test(fixed)) {
        fixed = fixed.replace(unquotedKeyRegex, '$1"$2"$3:');
        changes.push('Added quotes to unquoted object keys');
    }
    
    // Fix 4: Remove BOM if present
    if (fixed.charCodeAt(0) === 0xFEFF) {
        fixed = fixed.substring(1);
        changes.push('Removed BOM (Byte Order Mark)');
    }
    
    // Fix 5: Add missing root braces if it's just a value
    const trimmed = fixed.trim();
    if (trimmed && !trimmed.startsWith('{') && !trimmed.startsWith('[')) {
        fixed = `{${fixed}}`;
        changes.push('Wrapped content in object braces');
    }
    
    return { fixed, changes };
}

// Format JSON with proper indentation
export function formatTemplateJSON(template: TemplateJSON): string {
    return JSON.stringify(template, null, 2);
}

// Generate a sample template for reference
export function generateSampleTemplate(examType: ExamType = 'JEE'): TemplateJSON {
    const samples: Record<ExamType, TemplateJSON> = {
        JEE: {
            name: 'JEE Mains 2025 - Complete',
            description: 'Comprehensive JEE Mains preparation with Physics, Chemistry, and Mathematics',
            examType: 'JEE',
            class: 12,
            icon: 'GraduationCap',
            subjects: [
                {
                    name: 'Physics',
                    icon: 'Zap',
                    tasks: ['Lecture', 'DPP', 'Module', 'Notes', 'Revision'],
                    chapters: [
                        {
                            name: 'Electric Charges and Fields',
                            lectureCount: 8,
                            syllabus: [
                                { name: 'Electric Charge - Basic properties', completed: false },
                                { name: 'Coulombs Law', completed: false },
                                { name: 'Electric Field and Field Lines', completed: false },
                                { name: 'Electric Dipole and Dipole Moment', completed: false },
                                { name: 'Continuous Charge Distribution', completed: false },
                                { name: 'Gauss Law and Applications', completed: false },
                            ],
                        },
                        {
                            name: 'Electrostatic Potential and Capacitance',
                            lectureCount: 10,
                            syllabus: [
                                { name: 'Electric Potential and Potential Difference', completed: false },
                                { name: 'Equipotential Surfaces', completed: false },
                                { name: 'Potential due to Point Charge and Dipole', completed: false },
                                { name: 'Capacitors and Capacitance', completed: false },
                                { name: 'Parallel Plate Capacitor', completed: false },
                                { name: 'Energy Stored in Capacitor', completed: false },
                            ],
                        },
                    ],
                },
                {
                    name: 'Chemistry',
                    icon: 'FlaskConical',
                    tasks: ['Lecture', 'DPP', 'Module', 'Notes', 'Revision'],
                    chapters: [
                        {
                            name: 'Solid State',
                            lectureCount: 6,
                            syllabus: [
                                { name: 'Classification of Solids', completed: false },
                                { name: 'Crystal Lattices and Unit Cells', completed: false },
                                { name: 'Close Packed Structures', completed: false },
                                { name: 'Imperfections in Solids', completed: false },
                            ],
                        },
                    ],
                },
                {
                    name: 'Mathematics',
                    icon: 'Sigma',
                    tasks: ['Lecture', 'DPP', 'Module', 'Notes', 'Revision'],
                    chapters: [
                        {
                            name: 'Relations and Functions',
                            lectureCount: 8,
                            syllabus: [
                                { name: 'Types of Relations', completed: false },
                                { name: 'One to One and Onto Functions', completed: false },
                                { name: 'Composition of Functions', completed: false },
                                { name: 'Inverse Functions', completed: false },
                            ],
                        },
                    ],
                },
            ],
            defaultTodos: [
                { text: 'Complete daily DPP', priority: 'High' },
                { text: 'Revise previous notes', priority: 'Medium' },
                { text: 'Watch lecture videos', priority: 'High' },
            ],
        },
        NEET: {
            name: 'NEET 2025 - Complete',
            description: 'Complete NEET preparation with Physics, Chemistry, and Biology',
            examType: 'NEET',
            class: 12,
            icon: 'Stethoscope',
            subjects: [
                {
                    name: 'Physics',
                    icon: 'Zap',
                    tasks: ['Lecture', 'DPP', 'Notes'],
                    chapters: [
                        {
                            name: 'Physical World and Measurement',
                            lectureCount: 4,
                            syllabus: [
                                { name: 'Units and Measurements', completed: false },
                                { name: 'Significant Figures', completed: false },
                                { name: 'Dimensions and Dimensional Analysis', completed: false },
                            ],
                        },
                    ],
                },
                {
                    name: 'Chemistry',
                    icon: 'FlaskConical',
                    tasks: ['Lecture', 'DPP', 'Notes'],
                    chapters: [
                        {
                            name: 'Some Basic Concepts of Chemistry',
                            lectureCount: 6,
                            syllabus: [
                                { name: 'Laws of Chemical Combination', completed: false },
                                { name: 'Mole Concept and Molar Masses', completed: false },
                                { name: 'Percentage Composition', completed: false },
                            ],
                        },
                    ],
                },
                {
                    name: 'Biology',
                    icon: 'Microscope',
                    tasks: ['Lecture', 'Notes', 'Diagrams'],
                    chapters: [
                        {
                            name: 'The Living World',
                            lectureCount: 4,
                            syllabus: [
                                { name: 'Characteristics of Living Organisms', completed: false },
                                { name: 'Diversity in the Living World', completed: false },
                                { name: 'Taxonomic Categories', completed: false },
                            ],
                        },
                    ],
                },
            ],
            defaultTodos: [
                { text: 'Complete NCERT reading', priority: 'High' },
                { text: 'Practice MCQs', priority: 'High' },
            ],
        },
        BOARDS: {
            name: 'CBSE Class 12 - Science',
            description: 'CBSE Board examination preparation for Class 12 Science stream',
            examType: 'BOARDS',
            class: 12,
            icon: 'School',
            subjects: [
                {
                    name: 'Physics',
                    icon: 'Zap',
                    tasks: ['NCERT', 'Numericals', 'Derivations'],
                    chapters: [
                        {
                            name: 'Electric Charges and Fields',
                            lectureCount: 6,
                            syllabus: [
                                { name: 'Electric Charge', completed: false },
                                { name: 'Coulombs Law', completed: false },
                                { name: 'Electric Field', completed: false },
                            ],
                        },
                    ],
                },
                {
                    name: 'Chemistry',
                    icon: 'FlaskConical',
                    tasks: ['NCERT', 'Reactions', 'Numericals'],
                    chapters: [
                        {
                            name: 'Solutions',
                            lectureCount: 5,
                            syllabus: [
                                { name: 'Types of Solutions', completed: false },
                                { name: 'Concentration Terms', completed: false },
                            ],
                        },
                    ],
                },
                {
                    name: 'Mathematics',
                    icon: 'Sigma',
                    tasks: ['NCERT', 'Examples', 'Exercises'],
                    chapters: [
                        {
                            name: 'Relations and Functions',
                            lectureCount: 6,
                            syllabus: [
                                { name: 'Types of Relations', completed: false },
                                { name: 'Functions and their Types', completed: false },
                            ],
                        },
                    ],
                },
                {
                    name: 'English',
                    icon: 'Book',
                    tasks: ['Reading', 'Writing', 'Grammar'],
                    chapters: [
                        {
                            name: 'Reading Comprehension',
                            lectureCount: 4,
                            syllabus: [
                                { name: 'Unseen Passage', completed: false },
                                { name: 'Note Making', completed: false },
                            ],
                        },
                    ],
                },
            ],
            defaultTodos: [
                { text: 'Read NCERT daily', priority: 'High' },
                { text: 'Solve previous year questions', priority: 'Medium' },
            ],
        },
        CUSTOM: {
            name: 'My Custom Template',
            description: 'Create your own study plan',
            examType: 'CUSTOM',
            icon: 'Book',
            subjects: [
                {
                    name: 'Subject 1',
                    icon: 'Book',
                    tasks: ['Lecture', 'Notes'],
                    chapters: [
                        {
                            name: 'Chapter 1',
                            lectureCount: 5,
                            syllabus: [
                                { name: 'Topic 1', completed: false },
                                { name: 'Topic 2', completed: false },
                            ],
                        },
                    ],
                },
            ],
            defaultTodos: [
                { text: 'Study regularly', priority: 'High' },
            ],
        },
    };
    
    return samples[examType];
}

// Get validation error summary
export function getValidationSummary(result: TemplateValidationResult): string {
    if (result.isValid && result.errors.length === 0) {
        return '✅ Template is valid and ready to import';
    }
    
    const errorCount = result.errors.filter(e => e.severity === 'error').length;
    const warningCount = result.errors.filter(e => e.severity === 'warning').length;
    
    const parts: string[] = [];
    if (errorCount > 0) parts.push(`❌ ${errorCount} error${errorCount > 1 ? 's' : ''}`);
    if (warningCount > 0) parts.push(`⚠️ ${warningCount} warning${warningCount > 1 ? 's' : ''}`);
    
    return parts.join(', ') || '✅ Valid with no issues';
}
