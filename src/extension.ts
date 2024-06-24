import * as vscode from 'vscode';
import { CodingTimerExtension } from './timing/timer';
import { ProjectAnalysisProvider } from './file_analysis';

let codingTimer: CodingTimerExtension | undefined;

export function activate(context: vscode.ExtensionContext) {
    console.log('Activating Project Analysis extension');

    if (!vscode.workspace.workspaceFolders) {
        vscode.window.showWarningMessage('Coding Timer extension requires an open workspace to function properly.');
        return;
    }

    try {
        codingTimer = new CodingTimerExtension(context);
        context.subscriptions.push(codingTimer);
        console.log('msg: Coding Timer Extension has been activated and is ready to detect writing');

        // Register commands
        context.subscriptions.push(
            vscode.commands.registerCommand('project-analysis.showTotalTime', async () => {
                if (codingTimer) {
                    const totalTime = await codingTimer.getTotalTimeForAllFiles();
                    vscode.window.showInformationMessage(`Total coding time: ${totalTime / 1000} seconds`);
                }
            }),
            vscode.commands.registerCommand('project-analysis.showTopFiles', async () => {
                if (codingTimer) {
                    const topFiles = await codingTimer.getTopNFiles(5);
                    const message = topFiles.map(f => `${f.filePath}: ${f.totalTime / 1000} seconds`).join('\n');
                    vscode.window.showInformationMessage(`Top 5 files by coding time:\n${message}`);
                }
            })
        );

    } catch (error) {
        console.error('msg: Failed to initialize Coding Timer Extension', error);
        vscode.window.showErrorMessage('Failed to initialize Coding Timer. Some features may not work correctly.');
    }
    const projectAnalysisProvider=new ProjectAnalysisProvider();
    let refreshCommand = vscode.commands.registerCommand('project-analysis.refresh', () => {
        projectAnalysisProvider.refresh();
    });

    context.subscriptions.push(refreshCommand);


    console.log('Coding Timer Extension has been activated and is ready to detect writing');
}



export function deactivate() {
    if (codingTimer) {
        codingTimer.dispose();
    }
    console.log('Project Analysis extension deactivated');
}