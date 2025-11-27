import { getDB } from './db';
import { app } from 'electron';
import path from 'path';

export interface AppSettings {
  archivePath: string;
  namingTemplate: string;
  autoArchiveDelay: number; // in seconds
}

const DEFAULT_SETTINGS: AppSettings = {
  archivePath: path.join(app.getPath('documents'), 'FileArchive'),
  namingTemplate: '{date}_{title}.{extension}',
  autoArchiveDelay: 5
};

export async function getSettings(): Promise<AppSettings> {
  const db = getDB();
  if (!db) return DEFAULT_SETTINGS;

  const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
  const settings: any = { ...DEFAULT_SETTINGS };

  rows.forEach(row => {
    if (row.key in settings) {
      // Parse numbers if needed
      if (typeof DEFAULT_SETTINGS[row.key as keyof AppSettings] === 'number') {
        settings[row.key] = Number(row.value);
      } else {
        settings[row.key] = row.value;
      }
    }
  });

  return settings;
}

export async function saveSettings(settings: Partial<AppSettings>) {
  const db = getDB();
  if (!db) return;

  const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  
  const transaction = db.transaction((data: Partial<AppSettings>) => {
    for (const [key, value] of Object.entries(data)) {
      stmt.run(key, String(value));
    }
  });

  transaction(settings);
  return await getSettings();
}
