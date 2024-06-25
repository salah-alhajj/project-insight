create fancy and modern docs md file will used in vscode page preview and githuv repo and let area for images and gif


project structure:
src/
├── database/
│   ├──  index.ts         
│   └── manager.ts             
├── extensions/   
│   ├──  index.ts         
│   ├── extension_item.ts    
│   └── map.ts            
├── project_analsis/
│   ├── file_item          
│   ├── formater.ts                
│   ├── index.ts                
│   └── provider.ts   
├── timing/
│   ├── interface.ts              
│   └── timer.ts   
└── extension.ts    





timing/interface.ts
export interface FileTimings {
    [filePath: string]: {
        lastEdit: number;
        totalTime: number;
        isWriting: boolean;
    };
}  

timing/timer.ts   
import * as vscode from 'vscode';
import { FileTimings } from './interface';
import { DatabaseManager } from '../database';
import path from 'path';

export class CodingTimerExtension {
    private timings: FileTimings = {};
    private writeTimeout: NodeJS.Timeout | undefined;
    private disposables: vscode.Disposable[] = [];
    private dbManager: DatabaseManager=DatabaseManager.getInstance();

    constructor( ) {
        
        this.loadTimings();
        this.registerEventHandlers();
    }

    private async loadTimings(): Promise<void> {
        try {
            this.timings = await this.dbManager.loadAllTimings();
            console.log('Loaded saved timings');
        } catch (error) {
            console.error('Error loading timings', error);
            vscode.window.showErrorMessage('Failed to load coding timings. Some features may not work correctly.');
        }
    }

    private registerEventHandlers(): void {
        const onDidChangeTextDocument = vscode.workspace.onDidChangeTextDocument(this.handleTextDocumentChange.bind(this));
        const onDidChangeWorkspaceFolders = vscode.workspace.onDidChangeWorkspaceFolders(this.handleWorkspaceFoldersChange.bind(this));
        
        this.disposables.push(onDidChangeTextDocument, onDidChangeWorkspaceFolders);
    }

    private async handleWorkspaceFoldersChange(): Promise<void> {
        await this.dbManager.close();
        await this.loadTimings();
    }

    private handleTextDocumentChange(event: vscode.TextDocumentChangeEvent): void {

        if (path.dirname(event.document.uri.fsPath).includes('.vscode')) {
            return;
        }
        const filePath = event.document.uri.fsPath;
        const now = Date.now();

        if (!this.timings[filePath]) {
            this.timings[filePath] = {
                lastEdit: now,
                totalTime: 0,
                isWriting: true
            };
        } else if (!this.timings[filePath].isWriting) {
            // User started writing again
            this.timings[filePath].isWriting = true;
            this.timings[filePath].lastEdit = now;
        } else {
            // User is continuing to write
            const timeSinceLastEdit = now - this.timings[filePath].lastEdit;
            this.timings[filePath].totalTime += timeSinceLastEdit;
            this.timings[filePath].lastEdit = now;
        }

        // Reset the timeout
        if (this.writeTimeout) {
            clearTimeout(this.writeTimeout);
        }

        this.writeTimeout = setTimeout(() => {
            this.stopWriting(filePath);
        }, 5000);
    }

    private async stopWriting(filePath: string): Promise<void> {
        if (this.timings[filePath] && this.timings[filePath].isWriting) {
            const now = Date.now();
            const finalEditDuration = now - this.timings[filePath].lastEdit;
            this.timings[filePath].totalTime += (finalEditDuration-5000);
            this.timings[filePath].isWriting = false;
            console.log(`msg: Stopped writing in ${filePath}. Total writing time: ${this.timings[filePath].totalTime / 1000} seconds`);
            
            try {
                await this.dbManager.saveTimings(filePath, this.timings[filePath]);
            } catch (error) {
                console.error('Error saving timings', error);
                vscode.window.showErrorMessage('Failed to save coding timings. Some data may be lost.');
            }
        }
    }

    public getTimings(): FileTimings {
        return this.timings;
    }

    public async getTotalTimeForFile(filePath: string): Promise<number> {
        try {
            return await this.dbManager.getTotalTimeForFile(filePath);
        } catch (error) {
            console.error('Error getting total time for file', error);
            vscode.window.showErrorMessage('Failed to retrieve total time for file.');
            return 0;
        }
    }

    public async getTotalTimeForAllFiles(): Promise<number> {
        try {
            return await this.dbManager.getTotalTimeForAllFiles();
        } catch (error) {
            console.error('Error getting total time for all files', error);
            vscode.window.showErrorMessage('Failed to retrieve total coding time.');
            return 0;
        }
    }

    public async getTopNFiles(n: number): Promise<Array<{ filePath: string, totalTime: number }>> {
        try {
            return await this.dbManager.getTopNFiles(n);
        } catch (error) {
            console.error('Error getting top files', error);
            vscode.window.showErrorMessage(`Failed to retrieve top files by coding time.`);
            return [];
        }
    }

    public async stopAllWriting(): Promise<void> {
        for (const filePath of Object.keys(this.timings)) {
            await this.stopWriting(filePath);
        }
    }

    public async dispose(): Promise<void> {
        await this.stopAllWriting();
        if (this.writeTimeout) {
            clearTimeout(this.writeTimeout);
        }
        this.disposables.forEach(d => d.dispose());
        await this.dbManager.close();
    }
}           


project_analsis/provider.ts:
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { ExtensionItem } from '../extensions';
import { FileItem } from './file_item';
import { DatabaseManager } from '../database';
import { formatTime } from './formater';
export class ProjectAnalysisProvider implements vscode.TreeDataProvider<ExtensionItem | FileItem> {
    constructor(){
        const dbManager=DatabaseManager.getInstance();
    }
    private _onDidChangeTreeData: vscode.EventEmitter<ExtensionItem | FileItem | undefined | null | void> = new vscode.EventEmitter<ExtensionItem | FileItem | undefined | null | void>();
    private dbManager: DatabaseManager=DatabaseManager.getInstance();

    readonly onDidChangeTreeData: vscode.Event<ExtensionItem | FileItem | undefined | null | void> = this._onDidChangeTreeData.event;
    private getConfig() {
        return vscode.workspace.getConfiguration('projectAnalysis', vscode.workspace.workspaceFolders![0].uri);
    }
    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: ExtensionItem | FileItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: ExtensionItem | FileItem): Thenable<(ExtensionItem | FileItem)[]> {
        if (!vscode.workspace.workspaceFolders) {
            vscode.window.showInformationMessage('No folder opened');
            return Promise.resolve([]);
        }

        if (element instanceof ExtensionItem) {
            return Promise.resolve(this.getFilesForExtension(element.extension));
        } else {
            return Promise.resolve(this.getFileExtensions());
        }
    }

    private getFileExtensions(): ExtensionItem[] {
        const extensionsMap = new Map<string, { count: number, lines: number }>();
        this.traverseDirectory(vscode.workspace.workspaceFolders![0].uri.fsPath, extensionsMap);
        return Array.from(extensionsMap.entries())
            .sort(([, a], [, b]) => b.lines - a.lines) // Sort by number of lines in descending order
            .map(([ext, data]) => new ExtensionItem(ext, data.count, data.lines));
    }

    private shouldIncludeFile(filePath: string): boolean {
        const ext = path.extname(filePath).toLowerCase();
        const config = this.getConfig();
        const includeExtensions = config.get<string[]>('includeExtensions', []);
        const excludeExtensions = config.get<string[]>('excludeExtensions', []);

        if (includeExtensions.length > 0) {
            return includeExtensions.includes(ext);
        }

        return !excludeExtensions.includes(ext);
    }
    private shouldIncludeFolder(folderPath: string): boolean {
        const config = this.getConfig();
        const excludeFolders = config.get<string[]>('excludeFolders', ['node_modules', '.git']);
        const includeFolders = config.get<string[]>('includeFolders', []);

        const relativePath = path.relative(vscode.workspace.workspaceFolders![0].uri.fsPath, folderPath);
        const folderName = path.basename(folderPath);

        if (includeFolders.length > 0) {
            return includeFolders.some(includeFolder =>
                relativePath === includeFolder ||
                relativePath.startsWith(includeFolder + path.sep) ||
                includeFolder.startsWith(relativePath + path.sep)
            );
        }

        return !excludeFolders.includes(folderName);
    }
    private traverseDirectory(dirPath: string, extensionsMap: Map<string, { count: number, lines: number }>): void {
        if (!this.shouldIncludeFolder(dirPath)) {
            return;
        }

        try {
            const files = fs.readdirSync(dirPath);
            for (const file of files) {
                const filePath = path.join(dirPath, file);
                const stats = fs.statSync(filePath);
                if (stats.isDirectory()) {
                    this.traverseDirectory(filePath, extensionsMap);
                } else if (this.shouldIncludeFile(filePath)) {
                    const ext = this.getFileExtension(filePath);
                    const lineCount = this.getLineCount(filePath);
                    const data = extensionsMap.get(ext) || { count: 0, lines: 0 };
                    data.count++;
                    data.lines += lineCount;
                    extensionsMap.set(ext, data);
                }
            }
        } catch (error) {
            console.error(`Error traversing directory ${dirPath}: ${error}`);
        }
    }


    private async getFilesForExtension(extension: string): Promise<FileItem[]> {
        const files: FileItem[] = [];
        await this.findFilesWithExtension(vscode.workspace.workspaceFolders![0].uri.fsPath, extension, files);
        return files;
    }

    private async findFilesWithExtension(dirPath: string, extension: string, files: FileItem[]): Promise<void> {
        if (!this.shouldIncludeFolder(dirPath)) {
            return;
        }

        try {
            const dirFiles = fs.readdirSync(dirPath);
            for (const file of dirFiles) {
                const filePath = path.join(dirPath, file);
                const stats = fs.statSync(filePath);
                if (stats.isDirectory()) {
                    await this.findFilesWithExtension(filePath, extension, files);
                } else if (this.getFileExtension(filePath) === extension && this.shouldIncludeFile(filePath)) {
                    const lineCount = this.getLineCount(filePath);
                    const charCount = this.getCharCount(filePath);
                    const sizeInKB = (stats.size / 1024).toFixed(2);
                    const totalTime = await this.dbManager.getTotalTimeForFile(filePath);
                    console.log(`Total time for file ${filePath}: ${totalTime}`);
                    files.push(new FileItem(
                        vscode.Uri.file(filePath),
                        `${file} (${lineCount} lines, ${charCount} chars, ${sizeInKB} KB, ${formatTime(totalTime)} )`,
                        vscode.TreeItemCollapsibleState.None
                    ));
                }
            }
        } catch (error) {
            console.error(`err_msg: Error finding files in ${dirPath}: ${error}`);
        }
    }

    private getLineCount(filePath: string): number {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            return content.split('\n').length;
        } catch (error) {
            console.error(`err_msg: Error reading file ${filePath}: ${error}`);
            return 0;
        }
    }

    private getCharCount(filePath: string): number {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            return content.length;
        } catch (error) {
            console.error(`err_msg: Error reading file ${filePath}: ${error}`);
            return 0;
        }
    }

    private getFileExtension(filePath: string): string {
        const basename = path.basename(filePath);
        // check if contain two . return last two
        const extensions =
            basename.split('.').slice(1).join('.');
        return '.' + extensions;


    }
}





project_analsis/index.ts:
export * from './file_item';
export * from './provider';


project_analsis/formater.ts:
export function formatTime(ms: number): string {
    const milliseconds = ms % 1000;
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);

    const hoursDisplay = hours > 0 ? `${hours}h ` : '';
    const minutesDisplay = minutes > 0 ? `${minutes}m ` : '';
    const secondsDisplay = seconds > 0 ? `${seconds}s ` : '';
    const millisecondsDisplay = milliseconds > 0 ? `${milliseconds}ms` : '';

    return `${hoursDisplay}${minutesDisplay}${secondsDisplay}${millisecondsDisplay}`.trim() || '0ms';
}



project_analsis/file_item.ts:
import * as vscode from 'vscode';
import * as path from 'path';


export class FileItem extends vscode.TreeItem {
    constructor(
        public readonly resourceUri: vscode.Uri,
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);

        this.tooltip = this.label;
        this.description = path.relative(vscode.workspace.workspaceFolders![0].uri.fsPath, path.dirname(this.resourceUri.fsPath));
        this.contextValue = 'file';

        this.command = {
            command: 'vscode.open',
            title: 'Open File',
            arguments: [this.resourceUri]
        };
    }
}




extensions/index.ts:
export * from './item';
export * from './map';


extensions/item.ts:
import * as vscode from 'vscode';
import { ThemeIcon } from 'vscode';
import { getExtensionMap } from './map';
export class ExtensionItem extends vscode.TreeItem {
    constructor(
        public readonly extension: string,
        public readonly count: number,
        public readonly lines: number
    ) {
        super(ExtensionItem.getExtensionName(extension), vscode.TreeItemCollapsibleState.Collapsed);
        this.contextValue = 'extension';
        this.description = `${count} files, ${lines} lines`;
        this.resourceUri = vscode.Uri.file(`dummy${extension}`);
        this.iconPath = ThemeIcon.File;
    }

    static getExtensionName(extension: string): string {
        const extensionMap: { [key: string]: string } = getExtensionMap;

        return extensionMap[extension] || extension.charAt(1).toUpperCase() + extension.slice(2).toLowerCase();
    }
}



extensions/map:
export const getExtensionMap: { [key: string]: string } = {
    '.js': 'JavaScript',
    '.js.': 'JavaScript',
    '.ts': 'TypeScript',
    '.py': 'Python',
    '.html': 'HTML',
    '.css': 'CSS',
    '.json': 'JSON',
    // etc...
    }



database/index.ts:
export * from './manager';

database/manager.ts:
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




