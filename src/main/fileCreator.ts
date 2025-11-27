import { app, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import { format } from 'date-fns';
import { getDB } from './db';
import { startMonitoring } from './fileMonitor';
import { getSettings } from './settingsManager';

interface CreateFileOptions {
  type: { ext: string; name: string };
  filename: string;
  date: string;
  tags: string[];
}

export async function createFile(options: CreateFileOptions) {
  const { type, filename, date, tags } = options;
  
  // 1. Generate full filename
  // Fetch template from settings
  const settings = await getSettings();
  const template = settings.namingTemplate || '{date}_{title}.{extension}';
  
  const safeTitle = filename.replace(/[^a-z0-9\u4e00-\u9fa5_\-\s]/gi, '_');
  const now = new Date();
  const timeStr = format(now, 'HH-mm-ss');
  
  const finalName = template
    .replace('{date}', date)
    .replace('{title}', safeTitle)
    .replace('{extension}', type.ext.replace('.', ''))
    .replace('{time}', timeStr);
    
  // Ensure extension is correct if template didn't include it (safety check)
  // But user template includes .{extension}, so finalName should have it.
  // If user template is just "{title}", we might miss extension.
  // For now, assume template produces full filename.

  
  // 2. Determine path (Desktop for now)
  const desktopPath = app.getPath('desktop');
  const filePath = path.join(desktopPath, finalName);
  
  // 3. Create file
  try {
    // Check if file exists
    if (fs.existsSync(filePath)) {
      throw new Error('File already exists');
    }

    // TODO: Use proper templates for Office files
    // For now, we create empty files. 
    // Note: 0-byte .docx files are invalid. We need to handle this.
    fs.writeFileSync(filePath, '');
    
    // 4. Open file
    await shell.openPath(filePath);
    
    // Start monitoring
    startMonitoring(filePath);
    
    // 5. Save to DB
    const db = getDB();
    if (db) {
      const stmt = db.prepare(`
        INSERT INTO files (title, filename, path, extension, created_at, status)
        VALUES (?, ?, ?, ?, ?, 'active')
      `);
      const info = stmt.run(filename, finalName, filePath, type.ext, new Date().toISOString());
      const fileId = info.lastInsertRowid;
      
      // Save tags
      const insertTag = db.prepare('INSERT OR IGNORE INTO tags (name, created_at) VALUES (?, ?)');
      const linkTag = db.prepare('INSERT INTO file_tags (file_id, tag_id) VALUES (?, ?)');
      const getTagId = db.prepare('SELECT id FROM tags WHERE name = ?');
      
      for (const tag of tags) {
        insertTag.run(tag, new Date().toISOString());
        const tagRow = getTagId.get(tag) as { id: number };
        if (tagRow) {
          linkTag.run(fileId, tagRow.id);
        }
      }
    }
    
    return { success: true, filePath };
  } catch (error) {
    console.error('Failed to create file:', error);
    throw error;
  }
}
