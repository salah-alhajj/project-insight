import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    const projectAnalysisProvider = new ProjectAnalysisProvider();
    vscode.window.registerTreeDataProvider('yourView', projectAnalysisProvider);

    let refreshCommand = vscode.commands.registerCommand('project-analysis.refresh', () => {
        projectAnalysisProvider.refresh();
    });

    context.subscriptions.push(refreshCommand);
}

class ProjectAnalysisProvider implements vscode.TreeDataProvider<FileItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<FileItem | undefined | null | void> = new vscode.EventEmitter<FileItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<FileItem | undefined | null | void> = this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: FileItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: FileItem): Thenable<FileItem[]> {
        if (!vscode.workspace.workspaceFolders) {
            vscode.window.showInformationMessage('No folder opened');
            return Promise.resolve([]);
        }

        if (element) {
            return Promise.resolve(this.getFileStats(element.resourceUri.fsPath));
        } else {
            const workspaceFolder = vscode.workspace.workspaceFolders[0];
            return Promise.resolve(this.getFileStats(workspaceFolder.uri.fsPath));
        }
    }

    private getFileStats(folderPath: string): FileItem[] {
        const files = fs.readdirSync(folderPath);
        return files.map(file => {
            const filePath = path.join(folderPath, file);
            const stats = fs.statSync(filePath);
            if (stats.isDirectory()) {
                return new FileItem(
                    vscode.Uri.file(filePath),
                    file,
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'folder'
                );
            } else {
                const { lineCount, charCount } = this.getFileCounts(filePath);
                const sizeInKB = (stats.size / 1024).toFixed(2);
                return new FileItem(
                    vscode.Uri.file(filePath),
                    `${file} (${lineCount} lines, ${charCount} chars, ${sizeInKB} KB)`,
                    vscode.TreeItemCollapsibleState.None,
                    'file'
                );
            }
        });
    }

    private getFileCounts(filePath: string): { lineCount: number, charCount: number } {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n');
            const lineCount = lines.length;
            const charCount = content.length;
            return { lineCount, charCount };
        } catch (error) {
            console.error(`Error reading file ${filePath}: ${error}`);
            return { lineCount: 0, charCount: 0 };
        }
    }
}

class FileItem extends vscode.TreeItem {
    constructor(
        public readonly resourceUri: vscode.Uri,
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly contextValue: string
    ) {
        super(label, collapsibleState);
        
        this.tooltip = this.label;
        this.description = path.basename(path.dirname(this.resourceUri.fsPath));

        if (this.contextValue === 'file') {
            this.command = {
                command: 'vscode.open',
                title: 'Open File',
                arguments: [this.resourceUri]
            };
        }

        // this.iconPath = new vscode.ThemeIcon('file')
            
    }
}

export function deactivate() {}