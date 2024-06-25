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



