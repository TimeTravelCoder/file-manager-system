import { getDB } from './db';

export async function getFiles(filters: { search?: string; tag?: string; type?: string; date?: string } = {}) {
  const db = getDB();
  if (!db) return [];

  let query = `
    SELECT f.*, GROUP_CONCAT(t.name) as tags
    FROM files f
    LEFT JOIN file_tags ft ON f.id = ft.file_id
    LEFT JOIN tags t ON ft.tag_id = t.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (filters.search) {
    query += ` AND (f.filename LIKE ? OR f.title LIKE ?)`;
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }

  if (filters.type) {
    query += ` AND f.extension LIKE ?`;
    params.push(`%${filters.type}%`);
  }
  
  // Date filter (simple string match for now, ideally range)
  if (filters.date) {
    query += ` AND f.created_at LIKE ?`;
    params.push(`${filters.date}%`);
  }

  // Tag filter is tricky with GROUP_CONCAT, simpler to filter after or use EXISTS
  if (filters.tag) {
    query += ` AND EXISTS (
      SELECT 1 FROM file_tags ft2 
      JOIN tags t2 ON ft2.tag_id = t2.id 
      WHERE ft2.file_id = f.id AND t2.name = ?
    )`;
    params.push(filters.tag);
  }

  query += ` GROUP BY f.id ORDER BY f.created_at DESC`;

  const stmt = db.prepare(query);
  const rows = stmt.all(...params);
  
  return rows.map((row: any) => ({
    ...row,
    tags: row.tags ? row.tags.split(',') : []
  }));
}

export async function getTags() {
  const db = getDB();
  if (!db) return [];
  
  const rows = db.prepare('SELECT * FROM tags ORDER BY usage_count DESC, created_at DESC').all();
  return rows;
}
