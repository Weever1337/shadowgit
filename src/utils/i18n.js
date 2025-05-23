import fs from 'fs/promises';
import path from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const langsDir = path.resolve(__dirname, '../../langs');

const loadTranslations = async (lang) => {
    const filePath = path.join(langsDir, `${lang}.json`);
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error loading language file "${lang}":`, error);
        const fallback = await fs.readFile(path.join(langsDir, 'en.json'), 'utf8');
        return JSON.parse(fallback);
    }
};

const t = (template, params = {}) => {
    return Object.keys(params).reduce((str, key) => {
        return str.replace(`{${key}}`, params[key]);
    }, template);
};

export {loadTranslations, t};