import fs from 'fs';
import path from 'path';
import { getDB } from './db';
import { app } from 'electron';
import { getSettings } from './settingsManager';

interface FileState {
  path: string;
  status: 'waiting_for_lock' | 'locked' | 'archiving';
  lastCheck: number;
}

const monitoredFiles = new Map<string, FileState>();

export function startMonitoring(filePath: string) {
  monitoredFiles.set(filePath, {
    path: filePath,
    status: 'waiting_for_lock',
    lastCheck: Date.now()
  });
  console.log(`Started monitoring: ${filePath}`);
}

// Poll for file locks or changes
setInterval(() => {
  monitoredFiles.forEach(async (state, filePath) => {
    try {
      if (!fs.existsSync(filePath)) {
        monitoredFiles.delete(filePath);
        return;
      }

      // Check if file is locked
      // For Office files, also check for lock file (~$...)
      let isLocked = await checkFileLocked(filePath);
      
      const dir = path.dirname(filePath);
      const filename = path.basename(filePath);
      const lockFile = path.join(dir, `~$${filename}`);
      
      if (['.docx', '.xlsx', '.pptx'].includes(path.extname(filePath))) {
        if (fs.existsSync(lockFile)) {
          isLocked = true;
        }
      }

      if (state.status === 'waiting_for_lock') {
        if (isLocked) {
          state.status = 'locked';
          console.log(`File locked (editing started): ${filePath}`);
        }
      } else if (state.status === 'locked') {
        if (!isLocked) {
          // Was locked, now unlocked -> User closed it
          state.status = 'archiving';
          console.log(`File unlocked (editing finished): ${filePath}`);
          await archiveFile(filePath);
        }
      }
      
      state.lastCheck = Date.now();
      
    } catch (err) {
      console.error(`Error monitoring ${filePath}:`, err);
    }
  });
}, 2000); // Check every 2 seconds

async function checkFileLocked(filePath: string): Promise<boolean> {
  try {
    // Try to open for writing. If fails with EBUSY or EPERM, it might be locked.
    const fd = fs.openSync(filePath, 'r+');
    fs.closeSync(fd);
    return false;
  } catch (error: any) {
    if (error.code === 'EBUSY' || error.code === 'EPERM') {
      return true;
    }
    return false;
  }
}

export async function archiveFile(filePath: string) {
  // Move file to archive location
  // Archive / {year} / {month} / {type} /
  
  const db = getDB();
  // Get file info from DB
  const stmt = db.prepare('SELECT * FROM files WHERE path = ?');
  const fileRecord = stmt.get(filePath) as any;
  
  if (!fileRecord) {
    console.error('File not found in DB:', filePath);
    return;
  }
  
  const created = new Date(fileRecord.created_at);
  const year = created.getFullYear().toString();
  const month = (created.getMonth() + 1).toString().padStart(2, '0');
  const type = fileRecord.extension.replace('.', ''); // e.g. 'docx'
  
  // Construct archive path
  const settings = await getSettings();
  const archiveBase = settings.archivePath || path.join(app.getPath('documents'), 'FileArchive');
  const targetDir = path.join(archiveBase, year, month, type);
  
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  
  const targetPath = path.join(targetDir, fileRecord.filename);
  
  // Move file
  try {
    // Handle conflicts
    let finalTargetPath = targetPath;
    if (fs.existsSync(finalTargetPath)) {
       const name = path.parse(finalTargetPath).name;
       const ext = path.parse(finalTargetPath).ext;
       finalTargetPath = path.join(targetDir, `${name}_v${Date.now()}${ext}`);
    }
    
    fs.renameSync(filePath, finalTargetPath);
    console.log(`Archived ${filePath} to ${finalTargetPath}`);
    
    // Update DB
    db.prepare('UPDATE files SET path = ?, status = ?, archived_at = ? WHERE id = ?')
      .run(finalTargetPath, 'archived', new Date().toISOString(), fileRecord.id);
      
    monitoredFiles.delete(filePath);
    
  } catch (error) {
    console.error('Failed to archive:', error);
  }
}
