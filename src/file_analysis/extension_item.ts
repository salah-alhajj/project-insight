import * as vscode from 'vscode';
import { ThemeIcon } from 'vscode';
import { getExtensionMap } from '../extensions/map';
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


