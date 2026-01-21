---
name: plan
description: Break down a complex task into verifiable sub-steps before coding
---

Before writing any code, create an implementation plan.

## Step 1: Understand the Goal
- What is the expected output?
- What does "working" look like?
- How will we verify success?

## Step 2: Identify Dependencies
- What data/input is needed?
- What existing code does this build on?
- Are there relevant skills to read first?

## Step 3: Break Into Sub-Tasks
Create a numbered list where each task:
- Does ONE thing
- Can be tested independently
- Takes less than 50 lines of code
- Has clear success criteria

## Step 4: Identify Risks
- What's the trickiest part?
- Where might this fail?
- What assumptions are we making?

## Step 5: Propose Order
- Which task first?
- What can be parallelized?
- Where are the verification checkpoints?

---

## Output Format

```
## Plan: [Task Name]

### Goal
[One sentence describing success]

### Pre-requisites
- [ ] Read skill: [skill name]
- [ ] Existing code: [file/function]
- [ ] Data available: [what input we need]

### Sub-tasks
1. **[Task 1]** - [Description]
   - Input: [what it takes]
   - Output: [what it produces]
   - Test: [how to verify]

2. **[Task 2]** - [Description]
   ...

### Risks
- [Risk 1]: [Mitigation]
- [Risk 2]: [Mitigation]

### Checkpoint Order
Task 1 → verify → Task 2 → verify → ...
```

---

Do NOT proceed to implementation until the plan is approved.
