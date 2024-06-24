import * as sqlite3 from 'sqlite3'; 
import * as path from 'path';
import * as vscode from 'vscode';
import * as fs from 'fs';
import { FileTimings } from '../timing/interface';
import { CodingTimeRow, TotalTimeRow } from './interface';

export class DatabaseManager {
    private db: sqlite3.Database | null = null;
    private dbPath: string | null = null;

    constructor() {
        this.initializeDatabase();
    }

    private initializeDatabase(): void {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            console.error('No workspace folder open');
            vscode.window.showErrorMessage('Please open a workspace folder to use the Coding Timer extension.');
            return;
        }

        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        const vscodePath = path.join(workspaceRoot, '.vscode');
        
        if (!fs.existsSync(vscodePath)) {
            fs.mkdirSync(vscodePath);
        }

        this.dbPath = path.join(vscodePath, 'coding_timer.db');
        this.db = new sqlite3.Database(this.dbPath, (err) => {
            if (err) {
                console.error('Error opening database', err);
                vscode.window.showErrorMessage('Failed to open the database. Some features may not work correctly.');
            } else {
                console.log('Database opened successfully');
                this.createTable();
            }
        });
    }

    private createTable(): void {
        if (!this.db) return;

        const sql = `
        CREATE TABLE IF NOT EXISTS coding_times (
            file_path TEXT PRIMARY KEY,
            last_edit INTEGER,
            total_time INTEGER,
            is_writing INTEGER
        )`;
        this.db.run(sql, (err) => {
            if (err) {
                console.error('Error creating table', err);
            } else {
                console.log('Table created or already exists');
            }
        });
    }

    public saveTimings(filePath: string, data: { lastEdit: number, totalTime: number, isWriting: boolean }): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }

            const sql = `
            INSERT OR REPLACE INTO coding_times (file_path, last_edit, total_time, is_writing)
            VALUES (?, ?, ?, ?)
            `;
            this.db.run(sql, [filePath, data.lastEdit, data.totalTime, data.isWriting ? 1 : 0], (err) => {
                if (err) {
                    console.error('Error saving timing', err);
                    reject(err);
                } else {
                    console.log(`Saved timing for ${filePath}`);
                    resolve();
                }
            });
        });
    }

    public loadAllTimings(): Promise<FileTimings> {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }

            const sql = 'SELECT * FROM coding_times';
            this.db.all<CodingTimeRow>(sql, [], (err, rows) => {
                if (err) {
                    console.error('Error loading timings', err);
                    reject(err);
                } else {
                    const timings: FileTimings = {};
                    rows.forEach((row) => {
                        timings[row.file_path] = {
                            lastEdit: row.last_edit,
                            totalTime: row.total_time,
                            isWriting: Boolean(row.is_writing)
                        };
                    });
                    resolve(timings);
                }
            });
        });
    }

    public getTotalTimeForFile(filePath: string): Promise<number> {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }

            const sql = 'SELECT total_time FROM coding_times WHERE file_path = ?';
            this.db.get<CodingTimeRow>(sql, [filePath], (err, row) => {
                if (err) {
                    console.error('Error getting total time for file', err);
                    reject(err);
                } else {
                    resolve(row ? row.total_time : 0);
                }
            });
        });
    }

    public getTotalTimeForAllFiles(): Promise<number> {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }

            const sql = 'SELECT SUM(total_time) as total FROM coding_times';
            this.db.get<TotalTimeRow>(sql, [], (err, row) => {
                if (err) {
                    console.error('Error getting total time for all files', err);
                    reject(err);
                } else {
                    resolve(row ? row.total : 0);
                }
            });
        });
    }

    public getTopNFiles(n: number): Promise<Array<{ filePath: string, totalTime: number }>> {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }

            const sql = 'SELECT file_path, total_time FROM coding_times ORDER BY total_time DESC LIMIT ?';
            this.db.all<CodingTimeRow>(sql, [n], (err, rows) => {
                if (err) {
                    console.error('Error getting top files', err);
                    reject(err);
                } else {
                    resolve(rows.map(row => ({ filePath: row.file_path, totalTime: row.total_time })));
                }
            });
        });
    }

    public close(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                resolve();
                return;
            }

            this.db.close((err) => {
                if (err) {
                    console.error('Error closing database', err);
                    reject(err);
                } else {
                    console.log('Database closed');
                    this.db = null;
                    resolve();
                }
            });
        });
    }
}