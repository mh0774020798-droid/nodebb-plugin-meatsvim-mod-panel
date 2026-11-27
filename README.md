# Mod Panel for NodeBB

A moderation panel for your NodeBB staff: **flags, post queue and bans in one page**, with **per-section group permissions** set from the ACP.

Built by **[מעצבים טופ](https://meatsvim.top)** — the professional community for designers. The default look is the מעצבים טופ gold; you can change the accent colour in the ACP.

## Features

- **Overview** — open flags, posts awaiting approval and banned users at a glance, plus the latest flags.
- **Flags** — filter by state (open / in progress / resolved / rejected) and resolve, reject or mark "in progress" in one click.
- **Post queue** — approve or reject queued topics and replies.
- **Banned users** — see who is banned and until when, and unban.
- **Permissions per section** — pick which groups see each section. With nothing ticked, NodeBB's defaults apply: administrators and global moderators see everything, category moderators see only the categories they moderate.
- Hebrew (RTL) and English included.

## Install

From the ACP: **Extend → Plugins → Find Plugins**, search for `mod-panel`, install, activate, then **Rebuild & Restart**.

Or from the NodeBB folder:

```bash
npm install nodebb-plugin-meatsvim-mod-panel
./nodebb activate nodebb-plugin-meatsvim-mod-panel
./nodebb build && ./nodebb restart
```

## Setup

1. **ACP → Plugins → Mod Panel**: set the title, the accent colour and which groups see each section.
2. **ACP → Settings → Navigation**: enable the "Mod Panel" item and limit it to your staff groups, so it shows in the menu.
3. The panel lives at `/mod-panel`.

## Compatibility

NodeBB 3.2+ and 4.x.

---

# פאנל פיקוח ל-NodeBB

פאנל לצוות הפיקוח: **דיווחים, תור אישורים וחסימות בעמוד אחד**, עם **הרשאות לפי קבוצות לכל חלק** שמגדירים בפאנל הניהול.

נבנה ע"י **[מעצבים טופ](https://meatsvim.top)**. העיצוב בברירת המחדל הוא הזהב של מעצבים טופ, ואת הצבע אפשר לשנות בפאנל הניהול.

**התקנה:** פאנל ניהול ← הרחבות ← תוספים ← חיפוש `mod-panel` ← התקנה, הפעלה, ואז "בנייה מחדש והפעלה מחדש".

**הגדרה:** פאנל ניהול ← תוספים ← Mod Panel (כותרת, צבע והרשאות), ואז פאנל ניהול ← הגדרות ← ניווט כדי להוסיף את הפאנל לתפריט.

## License

MIT © מעצבים טופ
