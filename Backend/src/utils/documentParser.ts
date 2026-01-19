import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
// pdf-parse v1.x is CommonJS
const pdfParse = require('pdf-parse');

// Document parsing utilities
// Note: You'll need to install pdf-parse and mammoth packages

export interface ParsedDocument {
  text: string;
  metadata: {
    fileName: string;
    fileType: string;
    wordCount?: number;
  };
}

/**
 * Parse a document file and extract text content
 */
export async function parseDocument(filePath: string, fileName: string): Promise<ParsedDocument> {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  let text = '';
  
  try {
    switch (extension) {
      case 'pdf':
        text = await parsePDF(filePath);
        break;
      case 'docx':
        text = await parseDOCX(filePath);
        break;
      case 'txt':
        text = await parseTXT(filePath);
        break;
      default:
        throw new Error(`Unsupported file type: ${extension}`);
    }
    
    return {
      text: text.trim(),
      metadata: {
        fileName,
        fileType: extension || 'unknown',
        wordCount: text.split(/\s+/).length,
      },
    };
  } catch (error) {
    throw new Error(`Failed to parse document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parse PDF file
 */
async function parsePDF(filePath: string): Promise<string> {
  try {
    // pdf-parse v1.x is CommonJS, already imported at top
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    // If pdf-parse is not installed, provide helpful error
    if (error instanceof Error && error.message.includes('Cannot find module')) {
      throw new Error('PDF parsing requires pdf-parse package. Run: npm install pdf-parse');
    }
    throw error;
  }
}

/**
 * Parse DOCX file
 */
async function parseDOCX(filePath: string): Promise<string> {
  try {
    // Dynamic import to handle optional dependency
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } catch (error) {
    // If mammoth is not installed, provide helpful error
    if (error instanceof Error && error.message.includes('Cannot find module')) {
      throw new Error('DOCX parsing requires mammoth package. Run: npm install mammoth');
    }
    throw error;
  }
}

/**
 * Parse TXT file
 */
async function parseTXT(filePath: string): Promise<string> {
  const readFile = promisify(fs.readFile);
  const content = await readFile(filePath, 'utf-8');
  return content;
}

/**
 * Validate file type
 */
export function isValidFileType(fileName: string): boolean {
  const extension = fileName.split('.').pop()?.toLowerCase();
  return ['pdf', 'docx', 'txt'].includes(extension || '');
}

/**
 * Get file size in bytes
 */
export function getFileSize(filePath: string): number {
  const stats = fs.statSync(filePath);
  return stats.size;
}
