import fs from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';
import Migration from '../models/migration.js';
import {fileURLToPath} from "url";
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.resolve(__dirname, '../../migrations');

const connectDB = async () => {
    console.log(process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
};

const getMigrationFiles = async () => {
    const files = await fs.readdir(migrationsDir);
    return files
        .filter(file => file.endsWith('.js'))
        .sort();
};

const isMigrationApplied = async (name) => {
    const migration = await Migration.findOne({ name });
    return !!migration;
};

const applyMigration = async (file) => {
    const migration = await import(path.join(migrationsDir, file));
    const name = file.replace('.js', '');

    if (!(await isMigrationApplied(name))) {
        console.log(`Applying migration: ${name}`);
        await migration.up();
        await Migration.create({ name });
        console.log(`Migration ${name} applied successfully`);
    } else {
        console.log(`Migration ${name} already applied, skipping`);
    }
};

const revertMigration = async (file) => {
    const migration = await import(path.join(migrationsDir, file));
    const name = file.replace('.js', '');

    if (await isMigrationApplied(name)) {
        console.log(`Reverting migration: ${name}`);
        await migration.down();
        await Migration.deleteOne({ name });
        console.log(`Migration ${name} reverted successfully`);
    } else {
        console.log(`Migration ${name} not applied, skipping revert`);
    }
};

const runMigrations = async () => {
    try {
        await connectDB();
        const migrationFiles = await getMigrationFiles();

        for (const file of migrationFiles) {
            await applyMigration(file);
        }

        console.log('All migrations completed');
        await mongoose.connection.close();
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

const revertLastMigration = async () => {
    try {
        await connectDB();
        const migrationFiles = await getMigrationFiles();
        const lastMigration = migrationFiles[migrationFiles.length - 1];

        if (lastMigration) {
            await revertMigration(lastMigration);
        } else {
            console.log('No migrations to revert');
        }

        await mongoose.connection.close();
    } catch (error) {
        console.error('Revert failed:', error);
        process.exit(1);
    }
};

const main = async () => {
    const command = process.argv[2];
    if (command === 'revert') {
        await revertLastMigration();
    } else {
        await runMigrations();
    }
};

main();