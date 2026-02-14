import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
    Timestamp,
    increment,
} from 'firebase/firestore';
import { db } from './firebase';
import type { ProfileTemplate, TemplateSubject, TemplateJSON } from './types';

const TEMPLATES_COLLECTION = 'templates';

// Generate a short share code (e.g., "ABC-123-DEF")
function generateShareCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segments = 3;
    const segmentLength = 3;
    const codeSegments = [];
    
    for (let i = 0; i < segments; i++) {
        let segment = '';
        for (let j = 0; j < segmentLength; j++) {
            segment += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        codeSegments.push(segment);
    }
    
    return codeSegments.join('-');
}

// Ensure share code is unique
async function generateUniqueShareCode(): Promise<string> {
    let code = generateShareCode();
    let isUnique = false;
    let attempts = 0;
    
    while (!isUnique && attempts < 10) {
        const q = query(
            collection(db!, TEMPLATES_COLLECTION),
            where('shareCode', '==', code)
        );
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            isUnique = true;
        } else {
            code = generateShareCode();
            attempts++;
        }
    }
    
    return code;
}

// Create a new template
export async function createTemplate(
    templateData: Omit<ProfileTemplate, 'id' | 'createdAt' | 'updatedAt' | 'shareCode' | 'usageCount' | 'createdBy'>,
    userId: string
): Promise<ProfileTemplate> {
    if (!db) throw new Error('Database not initialized');
    
    const shareCode = await generateUniqueShareCode();
    
    const template: Omit<ProfileTemplate, 'id'> = {
        ...templateData,
        shareCode,
        usageCount: 0,
        createdBy: userId,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
    };
    
    const docRef = await addDoc(collection(db, TEMPLATES_COLLECTION), template);
    
    return {
        ...template,
        id: docRef.id,
    } as ProfileTemplate;
}

// Get all templates (admin only)
export async function getAllTemplates(): Promise<ProfileTemplate[]> {
    if (!db) throw new Error('Database not initialized');
    
    const q = query(
        collection(db, TEMPLATES_COLLECTION),
        orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
    })) as ProfileTemplate[];
}

// Get only active templates (for users)
export async function getActiveTemplates(): Promise<ProfileTemplate[]> {
    if (!db) throw new Error('Database not initialized');
    
    const q = query(
        collection(db, TEMPLATES_COLLECTION),
        where('isActive', '==', true),
        orderBy('usageCount', 'desc')
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
    })) as ProfileTemplate[];
}

// Get template by ID
export async function getTemplateById(templateId: string): Promise<ProfileTemplate | null> {
    if (!db) throw new Error('Database not initialized');
    
    const docRef = doc(db, TEMPLATES_COLLECTION, templateId);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) return null;
    
    return {
        ...snapshot.data(),
        id: snapshot.id,
    } as ProfileTemplate;
}

// Get template by share code
export async function getTemplateByShareCode(shareCode: string): Promise<ProfileTemplate | null> {
    if (!db) throw new Error('Database not initialized');
    
    const q = query(
        collection(db, TEMPLATES_COLLECTION),
        where('shareCode', '==', shareCode),
        where('isActive', '==', true)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return {
        ...doc.data(),
        id: doc.id,
    } as ProfileTemplate;
}

// Update template
export async function updateTemplate(
    templateId: string,
    updates: Partial<Omit<ProfileTemplate, 'id' | 'createdAt' | 'createdBy'>>
): Promise<void> {
    if (!db) throw new Error('Database not initialized');
    
    const docRef = doc(db, TEMPLATES_COLLECTION, templateId);
    
    await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
    });
}

// Delete template
export async function deleteTemplate(templateId: string): Promise<void> {
    if (!db) throw new Error('Database not initialized');
    
    const docRef = doc(db, TEMPLATES_COLLECTION, templateId);
    await deleteDoc(docRef);
}

// Toggle template active status
export async function toggleTemplateActive(templateId: string, isActive: boolean): Promise<void> {
    if (!db) throw new Error('Database not initialized');
    
    const docRef = doc(db, TEMPLATES_COLLECTION, templateId);
    
    await updateDoc(docRef, {
        isActive,
        updatedAt: serverTimestamp(),
    });
}

// Increment usage count (when user creates profile from template)
export async function incrementUsageCount(templateId: string): Promise<void> {
    if (!db) throw new Error('Database not initialized');
    
    const docRef = doc(db, TEMPLATES_COLLECTION, templateId);
    
    await updateDoc(docRef, {
        usageCount: increment(1),
        updatedAt: serverTimestamp(),
    });
}

// Duplicate template
export async function duplicateTemplate(
    templateId: string,
    newName: string,
    userId: string
): Promise<ProfileTemplate> {
    const original = await getTemplateById(templateId);
    
    if (!original) throw new Error('Template not found');
    
    const { id, createdAt, updatedAt, shareCode, usageCount, ...templateData } = original;
    
    return createTemplate(
        {
            ...templateData,
            name: newName,
            isActive: false, // Duplicated templates start inactive
        },
        userId
    );
}

// Export template to JSON
export function exportTemplateToJSON(template: ProfileTemplate): string {
    const exportData: TemplateJSON = {
        name: template.name,
        description: template.description,
        examType: template.examType,
        class: template.class,
        icon: template.icon,
        subjects: template.subjects,
        defaultTodos: template.defaultTodos,
    };
    
    return JSON.stringify(exportData, null, 2);
}

// Import template from JSON
export async function importTemplateFromJSON(
    jsonString: string,
    userId: string
): Promise<ProfileTemplate> {
    let parsed: TemplateJSON;
    
    try {
        parsed = JSON.parse(jsonString);
    } catch (error) {
        throw new Error('Invalid JSON format');
    }
    
    // Validate required fields
    if (!parsed.name || typeof parsed.name !== 'string') {
        throw new Error('Template name is required');
    }
    
    if (!parsed.examType || !['JEE', 'NEET', 'BOARDS', 'CUSTOM'].includes(parsed.examType)) {
        throw new Error('Valid examType is required (JEE, NEET, BOARDS, or CUSTOM)');
    }
    
    if (!parsed.subjects || !Array.isArray(parsed.subjects) || parsed.subjects.length === 0) {
        throw new Error('At least one subject is required');
    }
    
    // Validate subjects structure
    for (const subject of parsed.subjects) {
        if (!subject.name || !subject.icon || !Array.isArray(subject.chapters)) {
            throw new Error('Invalid subject structure');
        }
        
        for (const chapter of subject.chapters) {
            if (!chapter.name || typeof chapter.lectureCount !== 'number') {
                throw new Error('Invalid chapter structure');
            }
        }
    }
    
    return createTemplate(
        {
            name: parsed.name,
            description: parsed.description || '',
            examType: parsed.examType,
            class: parsed.class,
            icon: parsed.icon || 'Book',
            subjects: parsed.subjects,
            defaultTodos: parsed.defaultTodos || [],
            isActive: false, // Imported templates start inactive (admin must review)
        },
        userId
    );
}

// Get templates by exam type
export async function getTemplatesByExamType(examType: string): Promise<ProfileTemplate[]> {
    if (!db) throw new Error('Database not initialized');
    
    const q = query(
        collection(db, TEMPLATES_COLLECTION),
        where('examType', '==', examType),
        where('isActive', '==', true),
        orderBy('usageCount', 'desc')
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
    })) as ProfileTemplate[];
}

// Get popular templates (top by usageCount)
export async function getPopularTemplates(limit: number = 5): Promise<ProfileTemplate[]> {
    if (!db) throw new Error('Database not initialized');
    
    const q = query(
        collection(db, TEMPLATES_COLLECTION),
        where('isActive', '==', true),
        orderBy('usageCount', 'desc'),
        // Note: Firestore requires composite index for this query
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs
        .slice(0, limit)
        .map(doc => ({
            ...doc.data(),
            id: doc.id,
        })) as ProfileTemplate[];
}

// Clone template subjects for profile creation (deep copy)
export function cloneTemplateSubjects(subjects: TemplateSubject[]) {
    return subjects.map(subject => ({
        ...subject,
        chapters: subject.chapters.map(chapter => ({
            name: chapter.name,
            lectureCount: chapter.lectureCount,
            checkedState: {},
            syllabus: chapter.syllabus?.map(topic => ({
                name: topic.name,
                completed: false,
            })) || [],
        })),
    }));
}
