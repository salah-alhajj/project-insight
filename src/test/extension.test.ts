// import * as vscode from 'vscode';
// import { activate, deactivate } from '../extension';
// import { CodingTimerExtension } from '../timing/timer';
// import { ProjectAnalysisProvider } from '../project_analysis';
// import { DatabaseManager } from '../database';

// jest.mock('vscode', () => ({
//   EventEmitter: jest.fn(),
//   TreeItem: class MockTreeItem {
//     constructor(public label: string, public collapsibleState: number) {}
//   },
//   TreeItemCollapsibleState: {
//     Collapsed: 1,
//     None: 0,
//   },
//   ThemeIcon: {
//     File: 'file-icon',
//   },
//   Uri: {
//     file: jest.fn((f) => ({ fsPath: f })),
//   },
//   workspace: {
//     workspaceFolders: [{ uri: { fsPath: '/test/workspace' } }],
//     getConfiguration: jest.fn(),
//   },
//   window: {
//     showWarningMessage: jest.fn(),
//     showErrorMessage: jest.fn(),
//     registerTreeDataProvider: jest.fn(),
//   },
//   commands: {
//     registerCommand: jest.fn(),
//   },
// }));

// jest.mock('../timing/timer');
// jest.mock('../project_analysis');
// jest.mock('../database');

// describe('Extension', () => {
//   let mockContext: vscode.ExtensionContext;
//   let mockWorkspace: typeof vscode.workspace;
//   let mockWindow: typeof vscode.window;
//   let mockCommands: typeof vscode.commands;

//   beforeEach(() => {
//     mockContext = {
//       subscriptions: [],
//     } as any;

//     mockWorkspace = {
//       workspaceFolders: [{ uri: { fsPath: '/test/workspace' } }],
//       getConfiguration: jest.fn(),
//     } as any;

//     mockWindow = {
//       showWarningMessage: jest.fn(),
//       showErrorMessage: jest.fn(),
//       registerTreeDataProvider: jest.fn(),
//     } as any;

//     mockCommands = {
//       registerCommand: jest.fn(),
//     } as any;

//     // Use jest.spyOn instead of direct assignment
//     jest.spyOn(vscode, 'workspace', 'get').mockReturnValue(mockWorkspace);
//     jest.spyOn(vscode, 'window', 'get').mockReturnValue(mockWindow);
//     jest.spyOn(vscode, 'commands', 'get').mockReturnValue(mockCommands);

//     (DatabaseManager.getInstance as jest.Mock).mockReturnValue({});
//     (ProjectAnalysisProvider as jest.Mock).mockReturnValue({
//       refresh: jest.fn(),
//     });
//     (CodingTimerExtension as jest.Mock).mockReturnValue({
//       dispose: jest.fn(),
//     });

//     console.log = jest.fn();
//     console.error = jest.fn();
//   });

//   afterEach(() => {
//     jest.clearAllMocks();
//   });

//   test('activate function with workspace', () => {
//     activate(mockContext);

//     expect(DatabaseManager.getInstance).toHaveBeenCalledWith(mockContext);
//     expect(ProjectAnalysisProvider).toHaveBeenCalled();
//     expect(mockCommands.registerCommand).toHaveBeenCalledWith('project-analysis.refresh', expect.any(Function));
//     expect(mockWindow.registerTreeDataProvider).toHaveBeenCalledWith('project-analysis-view', expect.any(Object));
//     expect(CodingTimerExtension).toHaveBeenCalled();
//     expect(mockContext.subscriptions).toHaveLength(2);
//     expect(console.log).toHaveBeenCalledWith('msg: Coding Timer Extension has been activated and is ready to detect writing');
//   });

//   test('activate function without workspace', () => {
//     (mockWorkspace.workspaceFolders as any) = undefined;

//     activate(mockContext);

//     expect(mockWindow.showWarningMessage).toHaveBeenCalledWith('Coding Timer extension requires an open workspace to function properly.');
//     expect(DatabaseManager.getInstance).not.toHaveBeenCalled();
//     expect(ProjectAnalysisProvider).not.toHaveBeenCalled();
//     expect(CodingTimerExtension).not.toHaveBeenCalled();
//   });

//   test('activate function with CodingTimerExtension error', () => {
//     (CodingTimerExtension as jest.Mock).mockImplementation(() => {
//       throw new Error('Test error');
//     });

//     activate(mockContext);

//     expect(console.error).toHaveBeenCalledWith('msg: Failed to initialize Coding Timer Extension', expect.any(Error));
//     expect(mockWindow.showErrorMessage).toHaveBeenCalledWith('Failed to initialize Coding Timer. Some features may not work correctly.');
//   });

//   test('deactivate function', () => {
//     const mockDispose = jest.fn();
//     (CodingTimerExtension as jest.Mock).mockReturnValue({
//       dispose: mockDispose,
//     });

//     activate(mockContext);
//     deactivate();

//     expect(mockDispose).toHaveBeenCalled();
//     expect(console.log).toHaveBeenCalledWith('Project Analysis extension deactivated');
//   });
// });