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
            // call command project-insight.refresh
            vscode.commands.executeCommand('project-insight.refresh');

            
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