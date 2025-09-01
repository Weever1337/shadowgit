import fs from 'fs/promises';
import path from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const langsDir = path.resolve(__dirname, '../../langs');

const translationsCache = new Map();

export const loadTranslations = async (lang) => {
    if (translationsCache.has(lang)) {
        return translationsCache.get(lang);
    }

    const filePath = path.join(langsDir, `${lang}.json`);
    try {
        const fileContent = await fs.readFile(filePath, 'utf8');
        const translations = JSON.parse(fileContent);
        translationsCache.set(lang, translations);
        return translations;
    } catch (error) {
        console.error(`Error loading language file "${lang}", falling back to 'en':`, error);

        if (translationsCache.has('en')) {
            return translationsCache.get('en');
        }

        const fallbackContent = await fs.readFile(path.join(langsDir, 'en.json'), 'utf8');
        const fallbackTranslations = JSON.parse(fallbackContent);
        translationsCache.set('en', fallbackTranslations);
        return fallbackTranslations;
    }
};

export const t = (template, params = {}) => {
    if (!template) return '';
    let str = template;
    for (const key in params) {
        const regex = new RegExp(`{${key}}`, 'g');
        str = str.replace(regex, params[key]);
    }
    return str;
};