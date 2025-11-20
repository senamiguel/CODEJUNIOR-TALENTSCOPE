import { Candidate } from '../types';

/**
 * Normalizes a string for comparison by:
 * - Converting to lowercase
 * - Removing accents/diacritics
 * - Trimming whitespace
 * - Removing extra spaces
 */
export const normalizeString = (str: string): string => {
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .trim()
        .replace(/\s+/g, ' '); // Replace multiple spaces with single space
};

/**
 * Checks if a candidate is a duplicate of any existing candidate
 * @param newCandidate - The candidate to check
 * @param existingCandidates - Array of existing candidates
 * @returns Object with isDuplicate flag and matching candidate if found
 */
export const checkDuplicate = (
    newCandidate: Candidate,
    existingCandidates: Candidate[]
): { isDuplicate: boolean; match?: Candidate } => {
    const match = existingCandidates.find(existing => {
        // Primary check: by email (if both have email)
        if (newCandidate.email && existing.email) {
            const newEmail = normalizeString(newCandidate.email);
            const existingEmail = normalizeString(existing.email);
            if (newEmail === existingEmail) {
                return true;
            }
        }

        // Secondary check: by name + course combination
        const newName = normalizeString(newCandidate.name);
        const existingName = normalizeString(existing.name);
        const newCourse = normalizeString(newCandidate.course);
        const existingCourse = normalizeString(existing.course);

        return newName === existingName && newCourse === existingCourse;
    });

    return {
        isDuplicate: !!match,
        match
    };
};

/**
 * Generates a user-friendly identifier for a candidate
 */
export const getCandidateIdentifier = (candidate: Candidate): string => {
    return candidate.email || `${candidate.name} (${candidate.course})`;
};
