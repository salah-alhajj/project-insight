import * as vscode from 'vscode';
import { CodingTimerExtension } from './timing/timer';
import { ProjectAnalysisProvider } from './file_analysis';

let codingTimer: CodingTimerExtension | undefined;

export function activate(context: vscode.ExtensionContext) {
    console.log('Activating Project Analysis extension');

    // Start CodingTimerExtension immediately
    codingTimer = new CodingTimerExtension(context);
    context.subscriptions.push(codingTimer);

    // Register command to initialize other parts of the extension
    let initializeCommand = vscode.commands.registerCommand('project-analysis.initialize', () => {
        initializeProjectAnalysis(context);
    });

    context.subscriptions.push(initializeCommand);

    console.log('Coding Timer Extension has been activated and is ready to detect writing');
}

function initializeProjectAnalysis(context: vscode.ExtensionContext) {
    console.log('Initializing Project Analysis');
    
    const projectAnalysisProvider = new ProjectAnalysisProvider();
    vscode.window.registerTreeDataProvider('project-analysis-view', projectAnalysisProvider);

    let refreshCommand = vscode.commands.registerCommand('project-analysis.refresh', () => {
        projectAnalysisProvider.refresh();
    });

    context.subscriptions.push(refreshCommand);
}

export function deactivate() {
    if (codingTimer) {
        codingTimer.dispose();
    }
    console.log('Project Analysis extension deactivated');
}