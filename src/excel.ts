import { read, utils, WorkBook } from 'xlsx';

export interface ParsedData {
  names: Array<{ firstName: string; lastName: string }>;
  menus: Array<{ value: string }>;
}

const normalizeHeader = (value: string): string => value.trim().toLowerCase();

const headerCandidates = {
  firstName: ['prénom', 'prenom', 'first name', 'firstname'],
  lastName: ['nom', 'name', 'last name', 'lastname'],
  menu: ['choisis le menu', 'menu', 'choix', 'choix du menu'],
};

function findHeaderIndex(headers: string[], candidates: string[]): number {
  const normalized = headers.map(normalizeHeader);
  return normalized.findIndex((column) => candidates.includes(column));
}

export async function parseExcelFile(file: File): Promise<ParsedData> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook: WorkBook = read(arrayBuffer, { type: 'array' });
  const sheetNames = workbook.SheetNames;
  if (!sheetNames.length) {
    throw new Error('The Excel file does not contain any worksheet.');
  }

  const sheet = workbook.Sheets[sheetNames[0]];
  const rawRows = utils.sheet_to_json<Record<string, unknown>>(sheet, { header: 1, defval: '' });
  if (rawRows.length === 0) {
    throw new Error('The worksheet is empty.');
  }

  const headers = rawRows[0].map(String);
  const firstNameIndex = findHeaderIndex(headers, headerCandidates.firstName);
  const lastNameIndex = findHeaderIndex(headers, headerCandidates.lastName);
  const menuIndex = findHeaderIndex(headers, headerCandidates.menu);

  if (firstNameIndex < 0 && lastNameIndex < 0 && menuIndex < 0) {
    throw new Error('Excel file must contain columns for Prénom/Nom or Choisis le menu.');
  }

  const names: ParsedData['names'] = [];
  const menus: ParsedData['menus'] = [];

  for (let rowIndex = 1; rowIndex < rawRows.length; rowIndex += 1) {
    const row = rawRows[rowIndex] as Array<unknown>;
    if (firstNameIndex >= 0 && lastNameIndex >= 0) {
      const firstName = String(row[firstNameIndex] ?? '').trim();
      const lastName = String(row[lastNameIndex] ?? '').trim();
      if (firstName && lastName) {
        names.push({ firstName, lastName });
      }
    }

    if (menuIndex >= 0) {
      const value = String(row[menuIndex] ?? '').trim();
      if (value && value.toLowerCase() !== 'sans repas') {
        menus.push({ value });
      }
    }
  }

  return { names, menus };
}
