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
