# XtMate Claude Code Setup

## Folder Structure

Place these files in your home directory's Claude config:

```
~/.claude/
├── rules/
│   └── xtmate-quality.md          # Always-enforced standards
├── skills/
│   └── floor-plan-rendering/
│       └── SKILL.md               # Floor plan rendering algorithms
├── commands/
│   ├── plan.md                    # /plan - Break down before coding
│   └── verify-render.md           # /verify-render - Check rendering output
└── agents/
    └── sketch-reviewer.md         # Reviews sketch rendering quality
```

## Installation Commands

```bash
# Create directories
mkdir -p ~/.claude/rules
mkdir -p ~/.claude/skills/floor-plan-rendering
mkdir -p ~/.claude/commands
mkdir -p ~/.claude/agents

# Copy files (from wherever you downloaded them)
cp xtmate-quality.md ~/.claude/rules/
cp SKILL.md ~/.claude/skills/floor-plan-rendering/
cp plan.md ~/.claude/commands/
cp verify-render.md ~/.claude/commands/
cp sketch-reviewer.md ~/.claude/agents/
```

## How to Use

### When starting a floor plan task:
```
/plan Implement wall polygon rendering with proper corner joins
```

### When rendering looks wrong:
```
/verify-render Check why wall corners have gaps
```

### To delegate review:
```
@sketch-reviewer Review this floor plan rendering implementation
```
