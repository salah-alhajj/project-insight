import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import Datastore from 'nedb';
import { FileTimings } from '../timing/interface';


 interface CodingTimeRow {
    file_path: string;
    last_edit: number;
    total_time: number;
    is_writing: number;
}

export class DatabaseManager {
    private static instance: DatabaseManager | null = null;
    private static context: vscode.ExtensionContext | null = null;
    private db: Datastore | null = null;

    private constructor(context: vscode.ExtensionContext) {
        // 1. Robust Database Path Resolution
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            console.error("msg_err: No workspace folder found. Cannot initialize database.");
            return;
        }

        const dbPath = path.join(workspaceFolder.uri.fsPath, '.vscode', 'coding-times.db');
        fs.mkdirSync(path.dirname(dbPath), { recursive: true }); // Ensure directory exists

        this.db = new Datastore({ filename: dbPath, autoload: true });
    }

    public static getInstance(context?: vscode.ExtensionContext): DatabaseManager {
        if (DatabaseManager.instance === null) {
            if (!context) {
                throw new Error("DatabaseManager has not been initialized. Please provide a context.");
            }
            DatabaseManager.context = context;
            DatabaseManager.instance = new DatabaseManager(context);
        }
        return DatabaseManager.instance;
    }

    
    public saveTimings(filePath: string, data: { lastEdit: number, totalTime: number, isWriting: boolean }): void {
        if (!this.db) {
            return;

        };
        this.db.update(
            { file_path: filePath },
            { file_path: filePath, last_edit: data.lastEdit, total_time: data.totalTime, is_writing: data.isWriting ? 1 : 0 },
            { upsert: true },
            (err) => {
                if (err) {
                    console.error('msg_err: Error saving timings:', err);
                }
            }
        );
    }

    public loadAllTimings(): FileTimings {
        if (!this.db) {
            return {};
        } 
        const timings: FileTimings = {};
        this.db.find({}, (err: any, docs: CodingTimeRow[]) => {
            if (err) {
                console.error('msg_err: Error loading timings:', err);
                return;
            }
            docs.forEach((row) => {
                timings[row.file_path] = {
                    lastEdit: row.last_edit,
                    totalTime: row.total_time,
                    isWriting: Boolean(row.is_writing)
                };
            });
        });
        return timings;
    }

    public getTotalTimeForFile(filePath: string): Promise<number> {
        if (!this.db) {return Promise.resolve(0);}
        return new Promise((resolve, reject) => {
            this.db!.findOne({ file_path: filePath }, (err, doc: { total_time: number } | null) => {
                if (err) {
                    console.error('msg_err: Error getting total time for file:', err);
                    return reject(err);
                }
                if (doc) {
                    console.log(`msg: Retrieved total time for ${filePath}:`, doc.total_time);
                    return resolve(doc.total_time);
                } else {
                    console.log(`msg: No total time found for ${filePath}`);
                    return resolve(0);
                }
            });
        });
    }

    public getTotalTimeForAllFiles(): number {
        if (!this.db) {return 0;}
        let totalTime = 0;
        this.db.find({}, (err: any, docs: { total_time: number }[]) => {
            if (err) {
                console.error('msg_err: Error getting total time for all files:', err);
                return;
            }
            docs.forEach((doc) => {
                totalTime += doc.total_time;
            });
        });
        return totalTime;
    }

    public getTopNFiles(n: number): Promise<Array<{ filePath: string, totalTime: number }>> {
        if (!this.db) {return Promise.resolve([]);}
        return new Promise((resolve, reject) => {
            this.db!.find({})
                .sort({ total_time: -1 })
                .limit(n)
                .exec((err, docs: { file_path: string, total_time: number }[]) => {
                    if (err) {
                        console.error('msg_err: Error getting top N files:', err);
                        return reject(err);
                    }
                    const topFiles = docs.map((row) => ({ filePath: row.file_path, totalTime: row.total_time }));
                    resolve(topFiles);
                });
        });
    }
    
    

    public close(): void {
        // NeDB does not require explicit close operation
        this.db = null;
    }
}
