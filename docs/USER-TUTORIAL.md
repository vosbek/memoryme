# DevMemory User Tutorial - Getting Started Guide

Welcome to DevMemory! This comprehensive tutorial will guide you through all the features and help you become productive quickly. DevMemory is designed to be your intelligent memory assistant, helping you capture, organize, and rediscover your development knowledge.

## 📚 Table of Contents

1. [Getting Started](#getting-started)
2. [Your First Memory](#your-first-memory)
3. [Understanding Memory Types](#understanding-memory-types)
4. [Search and Discovery](#search-and-discovery)
5. [Knowledge Graph Exploration](#knowledge-graph-exploration)
6. [Advanced Features](#advanced-features)
7. [Best Practices](#best-practices)
8. [Tips and Tricks](#tips-and-tricks)
9. [Troubleshooting](#troubleshooting)

## 🚀 Getting Started

### First Launch

When you first launch DevMemory, you'll see a clean interface with several main areas:

1. **Top Menu Bar**: File, Edit, View, Window, Help
2. **Main Content Area**: Where your memories are displayed
3. **Sidebar**: Quick navigation and filters (when available)
4. **Status Bar**: Shows database health and sync status

### Initial Setup

DevMemory will automatically:
- Create a local database in your user data directory
- Initialize the hybrid vector search system (ChromaDB + Legacy)
- Set up the knowledge graph database
- Configure default settings

No manual configuration is required to get started!

### Interface Overview

#### Main Navigation
- **Memory List** (default view): Shows all your memories
- **Search**: Powerful search across all content
- **Knowledge Graph**: Visual representation of your knowledge
- **Settings**: Configure preferences and integrations

#### Quick Actions
- `Ctrl+N` (Windows/Linux) or `Cmd+N` (Mac): Create new memory
- `Ctrl+F` (Windows/Linux) or `Cmd+F` (Mac): Open search
- `Ctrl+G` (Windows/Linux) or `Cmd+G` (Mac): Open knowledge graph
- `Ctrl+L` (Windows/Linux) or `Cmd+L` (Mac): View memory list

## 📝 Your First Memory

Let's create your first memory to get familiar with the interface.

### Step 1: Create a New Memory

1. Click the **"New Memory"** button or press `Ctrl+N`
2. You'll see the Memory Editor with several fields

### Step 2: Fill in the Basic Information

**Title**: Give your memory a descriptive title
```
Example: "React useEffect Hook Best Practices"
```

**Type**: Choose the most appropriate memory type:
- **Code Snippet**: For code examples and implementations
- **Documentation**: For explanations and guides
- **Meeting Notes**: For meeting summaries and decisions
- **Debug Session**: For troubleshooting and problem-solving
- **API Call**: For API documentation and examples
- And more...

**Content**: Add the main content of your memory
```markdown
Example:
# React useEffect Best Practices

## Key Rules
1. Always include dependencies in the dependency array
2. Use cleanup functions for subscriptions
3. Split effects by concern

## Example
```javascript
useEffect(() => {
  const subscription = api.subscribe(handleData);
  return () => subscription.unsubscribe();
}, [api]); // Include dependencies
```
```

### Step 3: Add Tags and Metadata

**Tags**: Add relevant tags to help categorize your memory
```
Examples: react, hooks, useEffect, javascript, frontend
```

**Metadata**: Fill in additional context
- **Source**: Where this came from (documentation, colleague, experiment)
- **Project**: Related project name
- **URL**: Link to documentation or resources
- **Author**: Person who shared this knowledge

### Step 4: Save Your Memory

Click **"Save"** or press `Ctrl+S`. Your memory is now saved and will be:
- Stored in the local SQLite database
- Processed for semantic search using ChromaDB
- Analyzed for entity and relationship extraction
- Added to your personal knowledge graph

### What Happens Next

DevMemory's AI will automatically:

1. **Extract Entities**: Identify technologies (React, JavaScript), concepts (hooks, useEffect), and patterns
2. **Infer Relationships**: Connect React to JavaScript, useEffect to hooks, etc.
3. **Generate Embeddings**: Create semantic vectors for advanced search
4. **Update Knowledge Graph**: Add new connections to your knowledge web

## 🗃️ Understanding Memory Types

DevMemory supports various memory types, each optimized for different kinds of developer knowledge:

### Code Snippet
**Best for**: Reusable code examples, utilities, algorithms
**Example**: Database connection patterns, utility functions, configuration snippets

### Documentation
**Best for**: Explanations, how-to guides, architecture decisions
**Example**: API documentation, setup procedures, design rationales

### Meeting Notes
**Best for**: Team meetings, decision records, planning sessions
**Example**: Sprint planning notes, architecture review decisions

### Debug Session
**Best for**: Problem-solving records, troubleshooting steps
**Example**: Bug investigation process, performance optimization steps

### API Call
**Best for**: API examples, integration patterns, service documentation
**Example**: REST endpoint examples, authentication patterns

### Decision
**Best for**: Important decisions, trade-offs, architectural choices
**Example**: Technology selection rationale, design pattern decisions

### Project Context
**Best for**: Project setup, environment configuration, deployment notes
**Example**: Local development setup, CI/CD configuration

### Kubernetes Resource
**Best for**: K8s manifests, deployment patterns, operations procedures
**Example**: Deployment configs, service definitions, troubleshooting guides

### Command
**Best for**: Terminal commands, scripts, automation
**Example**: Git commands, build scripts, deployment commands

### Link
**Best for**: Important resources, bookmarks, reference materials
**Example**: Documentation links, tutorial resources, tool references

### Note
**Best for**: General observations, quick thoughts, reminders
**Example**: Learning notes, ideas, temporary reminders

## 🔍 Search and Discovery

DevMemory offers several powerful ways to find your information:

### Smart Search (Default)

The main search uses **intelligent routing** to provide the best results:

1. **Semantic Search**: Finds content based on meaning, not just keywords
2. **Keyword Search**: Traditional text matching for exact terms
3. **Graph Search**: Finds memories through entity relationships

#### Example Searches

**Semantic Search** (finds related concepts):
```
"database connection issues"
→ Finds memories about SQL errors, connection pools, timeout problems
```

**Keyword Search** (exact matches):
```
"useEffect"
→ Finds all memories containing the exact term "useEffect"
```

**Graph Search** (relationship-based):
```
"React projects"
→ Finds projects that use React, people who work on React, related technologies
```

### Advanced Search Options

Click the **Search Options** to access advanced features:

#### Search Methods
- **Auto**: Intelligent routing (recommended)
- **Vector**: Semantic similarity search
- **Text**: Traditional keyword search
- **Graph**: Entity relationship search
- **Hybrid**: Combines all methods

#### Filters
- **Memory Type**: Filter by specific types
- **Date Range**: Recent, last week, last month, custom range
- **Tags**: Search within specific tags
- **Project**: Filter by project metadata
- **Author**: Filter by content author

#### Search Tips

**Use Natural Language**:
```
✅ "How to handle React state updates"
✅ "Database performance optimization techniques"
✅ "JWT authentication implementation"
```

**Combine Keywords with Context**:
```
✅ "React hooks useState componentDidMount"
✅ "PostgreSQL query optimization indexes"
✅ "Docker deployment kubernetes production"
```

**Use Quotes for Exact Phrases**:
```
✅ "useEffect cleanup function"
✅ "SELECT * FROM users WHERE"
```

## 🕸️ Knowledge Graph Exploration

The Knowledge Graph is one of DevMemory's most powerful features, showing you the connections between all your knowledge.

### Opening the Knowledge Graph

1. Press `Ctrl+G` or click **View → Knowledge Graph**
2. You'll see an interactive visualization of your knowledge

### Understanding the Graph

#### Node Types (Color-Coded)
- 🔴 **Memories**: Your actual saved content
- 🔵 **Projects**: Extracted project names
- 🟢 **Technologies**: Programming languages, frameworks, tools
- 🟡 **People**: Colleagues, authors, contacts
- 🟣 **Organizations**: Companies, teams, groups
- 🟠 **APIs**: Service endpoints, integrations
- 🟤 **Files**: Code files, documents, resources
- 🔶 **Services**: Microservices, databases, systems
- 🟢 **Repositories**: Git repos, codebases
- 🟨 **Concepts**: Abstract ideas, patterns, principles

#### Relationship Types (Edge Colors)
- **uses**: X uses Y (technology dependencies)
- **works_on**: Person works on project
- **created_by**: X was created by person
- **depends_on**: X depends on Y
- **belongs_to**: X belongs to organization/project
- **implements**: X implements pattern/interface
- **calls**: Service calls another service
- **related_to**: General relationships

### Interacting with the Graph

#### Navigation Controls
- **Zoom In/Out**: Mouse wheel or +/- buttons
- **Pan**: Click and drag background
- **Reset View**: Reset button to center and zoom

#### Node Interactions
- **Hover**: See quick information
- **Click**: Select node and see detailed information
- **Double-click**: Open memory (for memory nodes)

#### Filtering Options
- **Search**: Find specific entities or memories
- **Entity Types**: Show/hide specific entity types
- **Memory Toggle**: Show/hide memory nodes
- **Entity Toggle**: Show/hide entity nodes

#### Side Panel Details
When you select a node, the side panel shows:
- **Basic Information**: Name, type, confidence score
- **Relationships**: All connected entities
- **Memory References**: Which memories mention this entity
- **Context**: How this entity was discovered

### Using the Graph for Discovery

#### Find Related Knowledge
1. Click on a technology you're working with
2. See all related projects, people, and concepts
3. Discover connections you might have forgotten

#### Explore Project Relationships
1. Select a project node
2. See all technologies, people, and related projects
3. Understand project dependencies and context

#### Discover Knowledge Gaps
1. Look for isolated nodes (few connections)
2. Find technologies without documentation
3. Identify areas needing more knowledge capture

#### Track Team Knowledge
1. See who works on what projects
2. Find expertise areas for different people
3. Discover collaboration patterns

## 🎯 Advanced Features

### Memory Management

#### Bulk Operations
- **Select Multiple**: Ctrl+click to select multiple memories
- **Bulk Edit**: Edit tags, project, or metadata for multiple memories
- **Bulk Delete**: Remove multiple memories at once

#### Memory Organization
- **Project-based**: Group memories by project metadata
- **Tag-based**: Organize using hierarchical tags
- **Type-based**: Filter and sort by memory types
- **Date-based**: Chronological organization

### Settings and Customization

#### Database Settings
- **Storage Location**: Change where data is stored
- **Backup Configuration**: Set up automatic backups
- **Sync Settings**: Configure cloud sync (if available)

#### AI and Search Settings
- **Embedding Provider**: Choose between AWS Bedrock, local models
- **Search Preferences**: Set default search method
- **Entity Extraction**: Configure automatic entity detection
- **Relationship Inference**: Tune relationship detection sensitivity

#### UI Preferences
- **Theme**: Light, dark, or system theme
- **Default View**: Set startup view (list, graph, search)
- **Keyboard Shortcuts**: Customize key bindings
- **Display Options**: Configure memory preview, metadata visibility

### Integration Features

#### VSCode Extension (When Available)
- **Automatic Capture**: Save code snippets with context
- **Project Detection**: Automatically detect current project
- **Git Integration**: Include branch and commit information
- **Terminal Integration**: Capture command history

#### Import/Export
- **Export Options**: JSON, Markdown, CSV formats
- **Import Sources**: Notion, Obsidian, plain text files
- **Backup Format**: Complete database export
- **Selective Export**: Export specific memories or projects

## 💡 Best Practices

### Effective Memory Creation

#### Write Descriptive Titles
```
❌ "React thing"
❌ "Bug fix"
❌ "API stuff"

✅ "React useCallback hook for expensive calculations"
✅ "Fixed memory leak in WebSocket connection cleanup"
✅ "Stripe payment API integration with error handling"
```

#### Use Consistent Tagging
```
Establish tag conventions:
- Technologies: react, javascript, python, docker
- Categories: bug-fix, feature, documentation, tutorial
- Projects: project-alpha, web-app, mobile-app
- Complexity: beginner, intermediate, advanced
```

#### Add Rich Context
- **Always include source**: Where did this come from?
- **Add project context**: Which project is this for?
- **Include timeline**: When was this relevant?
- **Note relationships**: What does this connect to?

#### Content Organization
```
Use consistent formatting:
# Main Topic

## Problem/Context
What situation prompted this?

## Solution/Approach
How was it solved?

## Code Example (if applicable)
```code here```

## References
- Link to documentation
- Related memories
- People involved
```

### Search Strategy

#### Start Broad, Then Narrow
1. Begin with general terms: "authentication"
2. Add context: "JWT authentication"
3. Include specifics: "JWT authentication Express.js middleware"

#### Use Multiple Search Methods
- Try semantic search first for concept-based queries
- Use keyword search for exact code or error messages
- Explore graph search for relationship discovery

#### Leverage the Knowledge Graph
- Use the graph to discover forgotten connections
- Follow entity relationships to find related knowledge
- Identify knowledge clusters and gaps

### Knowledge Graph Optimization

#### Regular Graph Exploration
- Weekly: Review new entities and relationships
- Monthly: Explore different entity types
- Quarterly: Analyze knowledge patterns and gaps

#### Entity Relationship Validation
- Check that inferred relationships make sense
- Look for missing connections between related concepts
- Validate that entity extraction caught important items

## 🔧 Tips and Tricks

### Keyboard Shortcuts

#### Global Shortcuts
- `Ctrl+N`: New memory
- `Ctrl+F`: Search
- `Ctrl+G`: Knowledge graph
- `Ctrl+L`: Memory list
- `Ctrl+S`: Save current memory
- `Ctrl+,`: Settings

#### Memory Editor
- `Ctrl+Enter`: Save and close
- `Ctrl+K`: Add tag
- `Tab`: Move between fields
- `Ctrl+Z`: Undo
- `Ctrl+Y`: Redo

#### Knowledge Graph
- `+/-`: Zoom in/out
- `R`: Reset view
- `Space + drag`: Pan
- `Escape`: Clear selection

### Search Power Tips

#### Semantic Search Tricks
```
Use related terms for broader results:
"error handling" → also finds "exception management", "fault tolerance"
"performance" → also finds "optimization", "speed", "efficiency"
```

#### Combining Search Types
1. Start with semantic search for concepts
2. Use graph search to find related entities
3. Refine with keyword search for specifics

#### Search by Code Patterns
```
Search for programming patterns:
"singleton pattern" → Find implementation examples
"observer pattern" → Find usage examples
"async await error handling" → Find error patterns
```

### Knowledge Graph Tips

#### Finding Hidden Connections
1. Look for entities with many connections (central concepts)
2. Find entities with few connections (potential knowledge gaps)
3. Explore relationship paths between distant concepts

#### Entity Type Analysis
```
Analyze your knowledge distribution:
- Technologies: What are you using most?
- People: Who are your key knowledge sources?
- Projects: What projects have most documentation?
- Concepts: What patterns do you use frequently?
```

#### Relationship Pattern Recognition
- Notice which technologies commonly work together
- Identify which people work on which projects
- Find which concepts appear across multiple projects

### Productivity Workflows

#### Daily Knowledge Capture
1. **Morning**: Review yesterday's memories for gaps
2. **During work**: Quick-capture code snippets and solutions
3. **End of day**: Summarize learnings and decisions

#### Weekly Knowledge Review
1. **Search recent memories**: "last week" filter
2. **Explore new graph connections**: See what entities were added
3. **Tag cleanup**: Ensure consistent tagging
4. **Relationship validation**: Check inferred relationships

#### Project Knowledge Management
1. **Project start**: Create project context memory
2. **During development**: Capture decisions, solutions, gotchas
3. **Project end**: Create summary memory with lessons learned

## 🐛 Troubleshooting

### Common Issues

#### Search Not Finding Expected Results

**Problem**: Search doesn't return memories you know exist

**Solutions**:
1. Try different search methods (semantic vs keyword)
2. Check spelling and try synonyms
3. Use broader terms first, then narrow down
4. Verify the memory has been saved and indexed

#### Knowledge Graph Shows No Relationships

**Problem**: Entities exist but no relationships are shown

**Possible Causes**:
1. Content doesn't contain clear relationship patterns
2. Entities were created manually without context
3. Relationship inference sensitivity is too low

**Solutions**:
1. Add more descriptive content to memories
2. Use explicit relationship language ("uses", "depends on", "created by")
3. Check entity extraction in memory details

#### Slow Performance

**Problem**: Application becomes slow with many memories

**Solutions**:
1. Check database health in settings
2. Restart the application
3. Consider archiving old, unused memories
4. Verify ChromaDB is properly initialized

#### Memory Not Saving

**Problem**: Memory editor doesn't save content

**Solutions**:
1. Check that title is not empty
2. Verify disk space is available
3. Check database permissions
4. Try restarting the application

### Getting Help

#### Built-in Help
- Use `F1` or Help menu for context-sensitive help
- Check status bar for system health indicators
- Review settings for configuration options

#### Advanced Troubleshooting
- Check application logs (available in settings)
- Verify database integrity
- Reset to default settings if needed
- Check for application updates

#### Community Resources
- GitHub repository for bug reports
- Documentation wiki for detailed guides
- Community forums for user discussions

## 🎓 Conclusion

Congratulations! You now have a comprehensive understanding of DevMemory's capabilities. Remember:

1. **Start Simple**: Begin with basic memory creation and search
2. **Explore Gradually**: Try different features as you become comfortable
3. **Use Consistently**: Regular use will build a valuable knowledge base
4. **Leverage Intelligence**: Let the AI help you discover connections
5. **Stay Organized**: Develop consistent tagging and naming conventions

DevMemory becomes more valuable as you use it more. The knowledge graph and relationship inference will help you discover patterns and connections you might not have noticed otherwise.

Happy knowledge building! 🚀

---

*Need help? Check the troubleshooting section or visit our documentation for more detailed guides.*