import * as vscode from 'vscode';
import { FileTimings } from './interface';



export  class CodingTimerExtension {
    private timings: FileTimings = {};
    private writeTimeout: NodeJS.Timeout | undefined;
    private disposables: vscode.Disposable[] = [];

    constructor(private context: vscode.ExtensionContext) {
        this.registerEventHandlers();
    }

    private registerEventHandlers(): void {
        const onDidChangeTextDocument = vscode.workspace.onDidChangeTextDocument(this.handleTextDocumentChange.bind(this));
        this.disposables.push(onDidChangeTextDocument);
    }

    private handleTextDocumentChange(event: vscode.TextDocumentChangeEvent): void {
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

    private stopWriting(filePath: string): void {
        if (this.timings[filePath] && this.timings[filePath].isWriting) {
            const now = Date.now();
            const finalEditDuration = now - this.timings[filePath].lastEdit;
            this.timings[filePath].totalTime += finalEditDuration;
            this.timings[filePath].isWriting = false;
            console.log(`Stopped writing in ${filePath}. Total writing time: ${this.timings[filePath].totalTime / 1000} seconds`);
            // Here you could persist the data, update UI, etc.
        }
    }

    public getTimings(): FileTimings {
        return this.timings;
    }

    public stopAllWriting(): void {
        Object.keys(this.timings).forEach(filePath => {
            this.stopWriting(filePath);
        });
    }

    public dispose(): void {
        this.stopAllWriting();
        if (this.writeTimeout) {
            clearTimeout(this.writeTimeout);
        }
        this.disposables.forEach(d => d.dispose());
    }
}

export function codingTimerExtension(context: vscode.ExtensionContext): void {
    const extension = new CodingTimerExtension(context);
    context.subscriptions.push(extension);

    console.log('Coding Timer Extension has been activated and is ready to detect writing');
}



