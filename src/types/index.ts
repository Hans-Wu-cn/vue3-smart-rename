import * as vscode from 'vscode';

export interface RenameOptions {
  /**
   * 是否更新所有文件中的引用
   */
  updateAllFiles: boolean;
  
  /**
   * 当前文件中的引用列表
   */
  currentFileReferences: vscode.Location[];
  
  /**
   * 其他文件中的引用列表
   */
  otherFileReferences: vscode.Location[];
}

export interface SymbolInfo {
  /**
   * 符号的旧名称
   */
  oldName: string;
  
  /**
   * 符号的新名称
   */
  newName: string;
  
  /**
   * 符号是否被导出
   */
  isExported: boolean;
  
  /**
   * 符号的位置
   */
  position: vscode.Position;
}