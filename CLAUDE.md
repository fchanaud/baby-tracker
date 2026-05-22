# Claude Code Instructions

## Environment: Obsidian Vault

This working directory is an **Obsidian vault**. You have full access to the Obsidian environment and should use all available methods to work with it efficiently.

### Obsidian CLI Access

- **Full CLI Access**: You have unrestricted access to interact with Obsidian via command-line tools
- **Direct File Manipulation**: All Obsidian notes are Markdown files - read/write them directly for maximum efficiency
- **macOS Integration**: Use `open` command to launch files in Obsidian app when needed

### Efficient Obsidian Workflows

#### 1. File Operations
- **Create notes**: Use `Write` tool to create `.md` files
- **Edit notes**: Use `Edit` tool for modifications
- **Read notes**: Use `Read` tool to view contents
- **Search vault**: Use `grep` or `find` via Bash to search across all notes

#### 2. Obsidian Conventions
- **Wikilinks**: Use `[[Note Name]]` syntax for internal links
- **Tags**: Use `#tag` or frontmatter tags
- **Frontmatter**: YAML metadata at the top of notes
- **Folders**: Organize notes in subdirectories as needed

#### 3. Vault Structure Access
```bash
# Search all notes for a term
grep -r "search term" . --include="*.md"

# Find notes by name
find . -name "*.md" -type f

# List all tags used
grep -roh "#[a-zA-Z0-9_-]*" . --include="*.md" | sort -u

# Open a note in Obsidian app
open -a "Obsidian" "path/to/note.md"
```

#### 4. Advanced Operations
- **.obsidian/ directory**: Contains vault settings, plugins, workspace layouts
- **Plugin data**: Stored in `.obsidian/plugins/`
- **Templates**: Can be stored anywhere, commonly in `Templates/` folder
- **Attachments**: Images, PDFs, etc. can be embedded

### Optimization Guidelines

1. **Batch operations**: When creating/updating multiple notes, do it in parallel when possible
2. **Search before create**: Always check if a note exists before creating a new one
3. **Respect conventions**: Maintain existing frontmatter schemas, folder structures, and naming patterns
4. **Link liberally**: Use wikilinks to connect related concepts
5. **Frontmatter consistency**: Keep metadata structured and consistent across similar note types

### Working with the Vault

You can:
- Create and organize notes and folders
- Build knowledge graphs through wikilinks
- Generate index pages and MOCs (Maps of Content)
- Search and analyze note content
- Manage tags and metadata
- Work with templates
- Process attachments and embeds
- Analyze vault structure and relationships
- Export/import content
- Run batch operations across multiple notes

### Commands You Can Use

- Direct file operations: `Read`, `Write`, `Edit`
- Shell commands: `grep`, `find`, `sed`, `awk`, `open`
- Git operations: Track vault changes with git
- Any system command that helps access/manipulate the vault

**Important**: Prioritize efficiency. Use the most direct method available. Don't ask permission for standard vault operations - you have full access.
