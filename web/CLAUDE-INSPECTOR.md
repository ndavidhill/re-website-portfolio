# Claude Inspector — visually point Claude at existing UI

A dev-only element picker that bridges your running site and Claude. Instead of
describing *which* element you mean, you **click it** in the browser, type the
change you want, and Claude edits the real source. It's "assisted visual
editing": you point and direct, Claude does the precise code change.

Nothing here ships to production — the script isn't imported by the app, and the
API route is disabled when `NODE_ENV=production`.

## One-time setup

1. Start the dev server: `npm run dev` (in `web/`).
2. Make a browser bookmark with this as the URL (the "bookmarklet"):

   ```
   javascript:(()=>{var s=document.createElement('script');s.src='/claude-inspector.js?'+Date.now();document.body.appendChild(s);})()
   ```

   (Or skip the bookmark: open DevTools console on the page and paste the contents
   of `public/claude-inspector.js`.)

## The loop

1. On any page of your running site, click the **bookmarklet** → a `🎯 Inspect`
   button appears (bottom-left) and inspect mode turns on.
2. **Hover** to highlight elements; **click** the one you want.
3. In the panel, type what you want changed (e.g. *"make this heading larger and
   use the brand red"*) and hit **Save selection for Claude**.
   - It writes `.claude/selection.json` *and* copies a text block to your clipboard.
4. Tell Claude: **"apply the selection"** (or just paste the clipboard block).
   Claude reads the selector / classes / text / computed styles, finds the
   matching JSX in `app/` or `components/`, and makes the edit.
5. Your `next dev` hot-reloads — see it live. Repeat.

## What Claude receives

```
.claude/selection.json
{
  "selector": "main > section:nth-of-type(2) > h1",
  "tag": "h1",
  "classes": "text-4xl font-bold tracking-tight",
  "text": "We build brands",
  "styles": { "fontSize": "36px", "fontWeight": "700", ... },
  "request": "make this larger and use the brand red",
  "url": "/about"
}
```

The `classes` + `text` are usually unique enough for Claude to locate the exact
source line via search.

## Remove it

Delete `public/claude-inspector.js` and `app/api/claude-inspect/`. That's all.

## Works on any project

The overlay is framework-agnostic. For a non-Next project (e.g. a static site),
copy `claude-inspector.js` into whatever folder the dev server serves, load it the
same way, and Claude reads the clipboard block (the file-write step is the only
Next-specific part).
