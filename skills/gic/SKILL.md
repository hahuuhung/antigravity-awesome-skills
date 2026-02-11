---
name: gic
alias-for: git-commit
description: Tạo commit message chuẩn.
user-invocable: true
risk: safe
source: "Derived from commit (Sentry conventions)"
---

# Git Commit Message Generator

This skill helps generate standard git commit messages, derived from the `commit` skill.
**Mục tiêu**: Tạo commit message chuẩn.

## Convention
Follow the pattern:
```
<type>(<scope>): <subject>

<body>

<footer>
```

## Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `ref`: Refactoring
- `test`: Adding tests
- `chore`: Maintenance

## Instructions
1.  Analyze the changes (staged files).
2.  Choose the appropriate type.
3.  Write a concise subject (max 50-70 chars, imperative mood).
4.  Write a detailed body if necessary.
5.  Start the commit message.

_(Refer to `commit` skill for full Sentry guidelines)_
