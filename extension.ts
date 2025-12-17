import * as vscode from 'vscode';
import { smartRename } from './src/commands/smartRename';

export function activate(context: vscode.ExtensionContext) {
    // 注册智能重命名命令
    const disposable = vscode.commands.registerCommand('vue3-smart-rename.smartRename', smartRename);
    
    context.subscriptions.push(disposable);
    
    console.log('Vue3 Smart Rename 插件已激活');
}

export function deactivate() {
    console.log('Vue3 Smart Rename 插件已停用');
}