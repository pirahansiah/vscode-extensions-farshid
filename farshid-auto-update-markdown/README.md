# farshid-auto-update-markdown

Automatically sorts markdown tables based on column names specified in a `.farshid/md-sort-columns.txt` configuration file.

**Creator:** Dr. Farshid Pirahansiah  
**Repository:** https://github.com/pirahansiah/myGitHub/vscode-extensions-farshid.git

## Features

- **Dynamic column sorting** — reads column names from `.farshid/md-sort-columns.txt`
- **Configuration flexibility** — config file can be in `.farshid/` folder at workspace root or same folder as markdown file
- **Auto-update on save** — tables are automatically sorted when you save markdown files
- **Manual command** — sort tables on demand via Command Palette

## How It Works

1. **Create `.farshid/md-sort-columns.txt`** in your workspace root (or in `.farshid/` next to your markdown file):
   ```
   goal
   priority
   top
   ```

2. **Markdown table** — include columns matching the names in `.farshid/md-sort-columns.txt`:
   ```markdown
   | goal | priority | top | status |
   |------|----------|-----|--------|
   | Document API | 15 | yes |  |
   | Learn TypeScript | 20 | yes | ✅ |
   | Fix bug | 16 | no |  |
   

   ```

3. **Save the file** — the extension automatically sorts the table by the columns in order

4. **Result:**
   ```markdown
   | goal | priority | top | status |
   |------|----------|-----|--------|
   | Document API | 15 | yes |  |
   | Fix bug | 16 | no |  |
   | Learn TypeScript | 20 | yes | ✅ |

   ```

## Installation

Install directly in VS Code:
```bash
code --install-extension md-sort-columns-1.0.2.vsix
```

Or build from source:
```bash
cd md-sort-columns
npm install
npm run compile
npm install -g @vscode/vsce
vsce package --skip-license --allow-missing-repository
```

## Usage

1. Create `.farshid/md-sort-columns.txt` with column names you want to sort by
2. Save your markdown file with tables - they'll automatically sort!
3. Or run: `Ctrl+Shift+P` → **`Auto Update MD: Sort Tables Now`**

**Supported value types:**
- Numbers (1, 2, 10, 100)
- Text (any case: Goal, GOAL, goal)
- Mixed: numbers sort before text

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `autoUpdateMD.configFileName` | `md-sort-columns.txt` | Configuration file name (inside `.farshid/` folder) |
| `autoUpdateMD.autoUpdateOnSave` | `true` | Auto-sort when saving |

## Config File Format

Create `.farshid/md-sort-columns.txt` with column names, one per line:
```
goal
priority
top
number
#

```

The extension will:
1. Look for `.farshid/md-sort-columns.txt` in the same directory as the markdown file
2. If not found, look in `.farshid/` at the workspace root
3. Sort all markdown tables by columns in order (first by goal, then priority, then top)

