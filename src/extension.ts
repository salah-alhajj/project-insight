import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    const projectAnalysisProvider = new ProjectAnalysisProvider();
    vscode.window.registerTreeDataProvider('project-analysis-view', projectAnalysisProvider);

    let refreshCommand = vscode.commands.registerCommand('project-analysis.refresh', () => {
        projectAnalysisProvider.refresh();
    });

    context.subscriptions.push(refreshCommand);
}

class ProjectAnalysisProvider implements vscode.TreeDataProvider<ExtensionItem | FileItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<ExtensionItem | FileItem | undefined | null | void> = new vscode.EventEmitter<ExtensionItem | FileItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<ExtensionItem | FileItem | undefined | null | void> = this._onDidChangeTreeData.event;

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
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([ext, data]) => new ExtensionItem(ext, data.count, data.lines));
    }

    private shouldIncludeFile(filePath: string): boolean {
        const ext = path.extname(filePath).toLowerCase();
        const config = vscode.workspace.getConfiguration('projectAnalysis', vscode.workspace.workspaceFolders![0].uri);
        const includeExtensions = config.get<string[]>('includeExtensions', []);
        const excludeExtensions = config.get<string[]>('excludeExtensions', []);

        console.log(`Checking file: ${filePath}`);
        console.log(`Include extensions: ${includeExtensions}`);
        console.log(`Exclude extensions: ${excludeExtensions}`);

        // If includeExtensions is not empty, only include files with those extensions
        if (includeExtensions.length > 0) {
            const shouldInclude = includeExtensions.includes(ext);
            console.log(`Include list not empty. Should include: ${shouldInclude}`);
            return shouldInclude;
        }

        // If includeExtensions is empty, include all files except those in excludeExtensions
        const shouldExclude = excludeExtensions.includes(ext);
        console.log(`Exclude list. Should exclude: ${shouldExclude}`);
        return !shouldExclude;
    }

    private traverseDirectory(dirPath: string, extensionsMap: Map<string, { count: number, lines: number }>): void {
        try {
            const files = fs.readdirSync(dirPath);
            for (const file of files) {
                const filePath = path.join(dirPath, file);
                const stats = fs.statSync(filePath);
                if (stats.isDirectory()) {
                    if (file === 'node_modules' || file === '.git') {
                        continue;
                    }
                    this.traverseDirectory(filePath, extensionsMap);
                } else if (this.shouldIncludeFile(filePath)) {
                    const ext = path.extname(file).toLowerCase();
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

    private getFilesForExtension(extension: string): FileItem[] {
        const files: FileItem[] = [];
        this.findFilesWithExtension(vscode.workspace.workspaceFolders![0].uri.fsPath, extension, files);
        return files;
    }

    private findFilesWithExtension(dirPath: string, extension: string, files: FileItem[]): void {
        try {
            const dirFiles = fs.readdirSync(dirPath);
            for (const file of dirFiles) {
                const filePath = path.join(dirPath, file);
                const stats = fs.statSync(filePath);
                if (stats.isDirectory()) {
                    if (file === 'node_modules' || file === '.git') {
                        continue;
                    }
                    this.findFilesWithExtension(filePath, extension, files);
                } else if (path.extname(file).toLowerCase() === extension && this.shouldIncludeFile(filePath)) {
                    const lineCount = this.getLineCount(filePath);
                    const charCount = this.getCharCount(filePath);
                    const sizeInKB = (stats.size / 1024).toFixed(2);
                    files.push(new FileItem(
                        vscode.Uri.file(filePath),
                        `${file} (${lineCount} lines, ${charCount} chars, ${sizeInKB} KB)`,
                        vscode.TreeItemCollapsibleState.None
                    ));
                }
            }
        } catch (error) {
            console.error(`Error finding files in ${dirPath}: ${error}`);
        }
    }

    private getLineCount(filePath: string): number {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            return content.split('\n').length;
        } catch (error) {
            console.error(`Error reading file ${filePath}: ${error}`);
            return 0;
        }
    }

    private getCharCount(filePath: string): number {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            return content.length;
        } catch (error) {
            console.error(`Error reading file ${filePath}: ${error}`);
            return 0;
        }
    }
}


class ExtensionItem extends vscode.TreeItem {
    constructor(
        public readonly extension: string,
        public readonly count: number,
        public readonly lines: number
    ) {
        super(ExtensionItem.getExtensionName(extension), vscode.TreeItemCollapsibleState.Collapsed);
        this.contextValue = 'extension';
        this.description = `${count} files, ${lines} lines`;
        this.iconPath = ExtensionItem.getIconForExtension(extension);
    }

    static getExtensionName(extension: string): string {
        const extensionMap: { [key: string]: string } = {
            '.js': 'JavaScript',
            '.ts': 'TypeScript',
            '.py': 'Python',
            '.html': 'HTML',
            '.css': 'CSS',
            '.json': 'JSON',
            '.md': 'Markdown',
            // Add more mappings as needed
        };
        return extensionMap[extension] || extension.slice(1).toUpperCase();
    }

    static getIconForExtension(extension: string): vscode.ThemeIcon {
        const iconMap: { [key: string]: string } = {
            '.js': 'javascript',
            '.ts': 'typescript',
            '.py': 'python',
            '.html': 'html',
            '.css': 'css',
            '.scss': 'css',
            '.less': 'css',
            '.json': 'json',
            '.md': 'markdown',
            '.xml': 'code',
            '.svg': 'svg',
            '.png': 'image',
            '.jpg': 'image',
            '.jpeg': 'image',
            '.gif': 'image',
            '.txt': 'text',
            '.pdf': 'pdf',
            '.doc': 'word',
            '.docx': 'word',
            '.xls': 'excel',
            '.xlsx': 'excel',
            '.ppt': 'powerpoint',
            '.pptx': 'powerpoint',
            '.c': 'c',
            '.cpp': 'cpp',
            '.cs': 'csharp',
            '.java': 'java',
            '.rb': 'ruby',
            '.php': 'php',
            '.go': 'go',
            '.rs': 'rust',
            '.swift': 'swift',
            '.dart': 'dart',
            '.vue': 'vue',
            '.jsx': 'react',
            '.tsx': 'react',
        };

        return new vscode.ThemeIcon(iconMap[extension] || 'file');
    }
}

class FileItem extends vscode.TreeItem {
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

export function deactivate() { }