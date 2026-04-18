import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

// Read configuration file  
async function getColumnNames(documentUri: vscode.Uri): Promise<string[]> {
    const config = vscode.workspace.getConfiguration('autoUpdateMD');
    const filename = config.get<string>('configFileName', 'md-sort-columns.txt');
    const configDir = '.farshid';
    
    // Try .farshid/ in document directory first
    const docDir = path.dirname(documentUri.fsPath);
    const localPath = path.join(docDir, configDir, filename);
    if (fs.existsSync(localPath)) {
        const content = fs.readFileSync(localPath, 'utf-8');
        return content.split('\n').map(x => x.trim()).filter(x => x);
    }
    
    // Try .farshid/ in workspace root
    const ws = vscode.workspace.getWorkspaceFolder(documentUri);
    if (ws) {
        const rootPath = path.join(ws.uri.fsPath, configDir, filename);
        if (fs.existsSync(rootPath)) {
            const content = fs.readFileSync(rootPath, 'utf-8');
            return content.split('\n').map(x => x.trim()).filter(x => x);
        }
    }
    
    return [];
}

// Extract cells from a table row
function getCells(line: string): string[] {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) return [];
    return trimmed.slice(1, -1).split('|').map(c => c.trim());
}

// Parse sort value for comparison
function parseValue(val: string): [number, number | string] {
    const num = parseFloat(val);
    if (!isNaN(num) && val.trim() !== '') {
        return [0, num]; // Numbers first, sorted numerically
    }
    return [1, val.toLowerCase()]; // Then strings, case-insensitive
}

// Compare two rows for sorting
function compareRows(rowA: string[], rowB: string[], colIndices: number[]): number {
    for (const idx of colIndices) {
        const valA = rowA[idx] || '';
        const valB = rowB[idx] || '';
        const a = parseValue(valA);
        const b = parseValue(valB);
        
        if (a[0] !== b[0]) return a[0] - b[0];
        if (a[1] !== b[1]) return a[1] < b[1] ? -1 : 1;
    }
    return 0;
}

// Sort tables in document
async function sortTables(document: vscode.TextDocument): Promise<boolean> {
    const cols = await getColumnNames(document.uri);
    if (cols.length === 0) return false;
    
    const lines = document.getText().split('\n');
    const edits: { line: number; newText: string }[] = [];
    
    for (let i = 0; i < lines.length; i++) {
        const headerCells = getCells(lines[i]);
        if (headerCells.length === 0) continue;
        
        // Check if next line is separator
        if (i + 1 >= lines.length) continue;
        const sepCells = getCells(lines[i + 1]);
        if (sepCells.length !== headerCells.length) continue;
        
        // Validate separator (all cells are dashes/colons)
        if (!sepCells.every(c => /^[-: ]+$/.test(c))) continue;
        
        // Find matching column indices
        const colIndices = cols
            .map(colName => headerCells.findIndex(h => h.toLowerCase() === colName.toLowerCase()))
            .filter(idx => idx >= 0);
        
        if (colIndices.length === 0) continue;
        
        // Find table rows
        let rowEnd = i + 2;
        const rowStartLine = rowEnd;
        while (rowEnd < lines.length) {
            const cells = getCells(lines[rowEnd]);
            if (cells.length !== headerCells.length) break;
            rowEnd++;
        }
        
        if (rowEnd <= rowStartLine) continue; // No rows
        
        // Parse and sort rows
        const oldRows = lines.slice(rowStartLine, rowEnd);
        const parsedRows = oldRows.map(line => getCells(line));
        const sortedRows = [...parsedRows].sort((a, b) => compareRows(a, b, colIndices));
        const newRows = sortedRows.map(cells => '| ' + cells.join(' | ') + ' |');
        
        // Check if changed
        for (let j = 0; j < oldRows.length; j++) {
            if (oldRows[j] !== newRows[j]) {
                edits.push({ line: rowStartLine + j, newText: newRows[j] });
            }
        }
        
        i = rowEnd - 1; // Skip past this table
    }
    
    if (edits.length === 0) return false;
    
    // Apply edits
    const edit = new vscode.WorkspaceEdit();
    for (const e of edits) {
        const range = new vscode.Range(e.line, 0, e.line, lines[e.line].length);
        edit.replace(document.uri, range, e.newText);
    }
    await vscode.workspace.applyEdit(edit);
    return true;
}

// Create sample config file in .farshid/ on first activation
async function createSampleConfig(): Promise<void> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) return;

    const config = vscode.workspace.getConfiguration('autoUpdateMD');
    const filename = config.get<string>('configFileName', 'md-sort-columns.txt');

    for (const folder of workspaceFolders) {
        const configDir = path.join(folder.uri.fsPath, '.farshid');
        const configPath = path.join(configDir, filename);

        if (fs.existsSync(configPath)) continue;

        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
        }

        const sampleContent = [
            'goal',
            'priority',
            'top',
            'number',
            '#',
            ''
        ].join('\n');

        fs.writeFileSync(configPath, sampleContent, 'utf-8');
    }
}

export function activate(context: vscode.ExtensionContext) {
    const processing = new Set<string>();

    // Create sample config on first activation
    createSampleConfig();
    
    // Manual command
    context.subscriptions.push(
        vscode.commands.registerCommand('autoUpdateMD.sortTables', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor || editor.document.languageId !== 'markdown') {
                vscode.window.showWarningMessage('Open a markdown file first');
                return;
            }
            const changed = await sortTables(editor.document);
            if (changed) {
                await editor.document.save();
                vscode.window.showInformationMessage('Tables sorted!');
            } else {
                vscode.window.showInformationMessage('No changes');
            }
        })
    );
    
    // Auto-sort on save
    context.subscriptions.push(
        vscode.workspace.onDidSaveTextDocument(async (doc) => {
            const config = vscode.workspace.getConfiguration('autoUpdateMD');
            if (!config.get<boolean>('autoUpdateOnSave', true)) return;
            if (doc.languageId !== 'markdown') return;
            
            const key = doc.uri.toString();
            if (processing.has(key)) return;
            
            processing.add(key);
            try {
                const changed = await sortTables(doc);
                if (changed) await doc.save();
            } finally {
                processing.delete(key);
            }
        })
    );
}

export function deactivate() {}
