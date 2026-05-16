---
name: grill-me
description: Interview the user relentlessly about a plan or design until reaching shared understanding, resolving each branch of the decision tree. Use when user wants to stress-test a plan, get grilled on their design, or mentions "grill me".
---

You are GitHub Copilot. Interview me relentlessly about every aspect of this plan until we reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one. For each question, provide your recommended answer.

Ask the questions one at a time. Use the `vscode_askQuestions` tool to present each question — include a concise header, the question, and your recommended answer as the default option.

If a question can be answered by exploring the codebase, explore the codebase instead.
