# 🔓 WEEKENDTHRILLER BLACK MARKET BOT

Your Discord bot enhanced with neon purple/magenta black market aesthetic.

## Quick Start (30 seconds)

1. **Extract the ZIP**
2. **Replace your `commands.js`** with `commands_enhanced.js`
3. **Restart the bot**: `npm start`
4. **Done** - Run `/blackmarket` to see the new look

## What's Inside

```
🔓 bot/
├── commands_enhanced.js    ← Use this as your new commands.js
├── bot.js                  ← Original (no changes needed)
├── package.json            ← Dependencies (no changes)
└── logo.png               ← Your branding
```

## What Changed

✅ **Colors**: All embeds now use neon purple `#9D00FF` (matches your logo)
✅ **Black market vibe**: Aggressive, exclusive, premium styling
✅ **New command**: `/blackmarket` - 3-embed service showcase
✅ **Utilities**: `BLACK_MARKET` object for consistent embed design
✅ **Zero breaking changes**: Drop-in replacement, everything still works

## Key Colors

| Use | Hex | RGB |
|-----|-----|-----|
| Primary | `#9D00FF` | (157, 0, 255) |
| Accent (VIP) | `#FF00FF` | (255, 0, 255) |

## Files Explained

**commands_enhanced.js** (252KB)
- All slash commands with BLACK MARKET aesthetic
- New `/blackmarket` command included
- BLACK_MARKET utility functions for embeds
- COLOR updated to neon purple
- Drop-in replacement for your original commands.js

**bot.js** (16KB)
- Unchanged from your original
- Included for reference
- No modifications needed

**package.json** (4KB)
- Unchanged from your original
- All dependencies the same

**logo.png**
- Your WEEKENDTHRILLER branding

## Installation

### Step 1: Backup
```bash
cp commands.js commands.js.backup
```

### Step 2: Deploy
```bash
cp commands_enhanced.js commands.js
npm start
```

### Step 3: Verify
Run `/blackmarket` - you should see 3 sick embeds with neon purple styling.

## Customization

### Change Primary Color
Open `commands.js` (renamed from `commands_enhanced.js`), find this line:
```javascript
COLOR: "#9D00FF",
```
Replace `#9D00FF` with any hex color you want.

### Add More Black Market Commands
Copy the `blackMarketShowcase` command structure and use:
```javascript
BLACK_MARKET.createPremiumEmbed("Title", "Description")
BLACK_MARKET.createExclusiveEmbed("Title")
```

## All Commands Still Work

✅ `/ticket`
✅ `/vouch`
✅ `/shop`
✅ `/rank`
✅ `/blackmarket` ← NEW
✅ Everything else unchanged

## Support

- All existing permissions stay the same
- All existing handlers stay the same
- All existing databases work the same
- 100% backwards compatible
- Code is well-commented

## That's It

One file swap, one restart. Your bot now has BLACK MARKET vibes that match your logo perfectly.

**Questions?** The code is straightforward. `commands_enhanced.js` is well-commented.

---

**WEEKENDTHRILLER | RANK BOOSTING | BLACK MARKET SERVICES** 🔓⚡
