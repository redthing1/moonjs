---
title: Examples
order: 9
---

Here are some official Moon examples.

## Browser HTML examples (in this repo)

The `examples/` folder contains self‑contained HTML files that work once you have built and vendored `packages/moon-web/dist/moon-web.min.js`:

- `examples/moon-web.html`  
  Minimal counter showing `Moon.view.mount` and assignments to `Moon.m.view`.
- `examples/moon-web-dashboard.html`  
  Workspace dashboard with tabs, search, filters, priorities, and add/toggle/remove item interactions. This example uses the `cls` helper and exercises list keys, nested components, and forms.
- `examples/moon-web-kanban.html`  
  Multi‑column Kanban board with filters and move actions, showcasing more complex list updates and layout while keeping the UI minimal and monochrome.

All of these can be opened directly via `file://` after a build; they are a good reference for the browser‑only workflow described in [Browser](/browser).

## Playground snippets (original site)

The original Moon site also ships interactive playground examples:

- [Todo Application](/play)
