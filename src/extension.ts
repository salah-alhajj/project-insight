import * as path from 'path';
import * as vscode from 'vscode';

import { CodingTimerExtension } from './timing/timer';
import { ProjectAnalysisProvider } from './project_analysis';
import { DatabaseManager } from './database';

let codingTimer: CodingTimerExtension | undefined;

export function activate(context: vscode.ExtensionContext) {
    DatabaseManager.getInstance(context);

    

    if (!vscode.workspace.workspaceFolders) {
        vscode.window.showWarningMessage('Coding Timer extension requires an open workspace to function properly.');
        return;
    }
    const projectAnalysisProvider=new ProjectAnalysisProvider();

    let refreshCommand = vscode.commands.registerCommand('project-insight.refresh', () => {
        projectAnalysisProvider.refresh();
    });
    vscode.window.registerTreeDataProvider('project-insight-view', projectAnalysisProvider);
    
    try {

        codingTimer = new CodingTimerExtension();

        context.subscriptions.push(codingTimer);

        
    } catch (error) {
        console.error('msg: Failed to initialize Coding Timer Extension', error);
        vscode.window.showErrorMessage('Failed to initialize Coding Timer. Some features may not work correctly.');
    }
    

    context.subscriptions.push(refreshCommand);


}



export function deactivate() {
    if (codingTimer) {
        codingTimer.dispose();
    }
}