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

  
  // 2. Determine path (Use Documents by default for better permissions)
  const documentsPath = app.getPath('documents');
  const filePath = path.join(documentsPath, finalName);
  

    // 3. Create file
    try {
      if (fs.existsSync(filePath)) {
        throw new Error(`File already exists at ${filePath}`);
      }
      
      // For Office files, create minimal valid content
      // Note: These are still not fully valid Office files, but better than 0-byte
      // Proper implementation would require using templates or libraries
      let content = '';
      if (type.ext === '.txt' || type.ext === '.md' || type.ext.match(/\.(js|ts|py|java|cpp|html|css|json)$/)) {
        // Text-based files can be empty
        content = '';
      } else {
        // For other file types, add a placeholder comment
        content = '# Placeholder file created by File Manager\n';
      }
      
      fs.writeFileSync(filePath, content);
    } catch (e) {
      console.error('[Debug] File write failed:', e);
      throw new Error(`Failed to write file: ${(e as any).message}`);
    }
    
    // 4. Open file
    try {
      const error = await shell.openPath(filePath);
      if (error) {
        console.error('[Debug] Shell open failed:', error);
        // Don't throw here, just log, as file is created
      }
    } catch (e) {
      console.error('[Debug] Shell open exception:', e);
    }
    
    // 5. Save to DB
    try {
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
            // Increment usage_count
            db.prepare('UPDATE tags SET usage_count = usage_count + 1 WHERE id = ?').run(tagRow.id);
          }
        }
      }
    } catch (e) {
      console.error('[Debug] Database insert failed:', e);
      throw new Error(`Database error: ${(e as any).message}`);
    }
    
    // Start monitoring (non-blocking)
    try {
      startMonitoring(filePath);
    } catch (e) {
      console.error('[Debug] Monitoring failed:', e);
    }
    
    return { success: true, filePath };
}
