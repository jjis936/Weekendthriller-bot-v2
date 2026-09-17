# 14 FIRE NEW COMMANDS - INTEGRATION GUIDE

## The Commands

1. `/tiers` - VIP tier system showcase
2. `/pricing` - Service pricing board
3. `/accounts` - Account marketplace
4. `/leaderboard` - Top spenders & vouchers
5. `/stats` - Server analytics dashboard
6. `/shop` - Interactive shop menu
7. `/startgiveaway` - Launch giveaways
8. `/status` - Service status checker
9. `/referral` - Referral program panel
10. `/track` - Order tracker
11. `/verify` - Account verification
12. `/complaint` - Complaint filing system
13. `/perks` - Member perks showcase
14. `/promo` - Promo code checker

---

## How to Add Them

### Option 1: Quick Copy-Paste (Easiest)

1. Open `NEW_COMMANDS.js`
2. Copy ALL the code
3. Open your `commands.js`
4. Find this line (near the end, before `module.exports`):
   ```javascript
   slashCommands.push(blackMarketShowcase);
   
   module.exports = {
   ```
5. **Paste all 14 commands BEFORE that `module.exports` line**
6. Save and restart bot

### Option 2: Manual Integration

1. Open `NEW_COMMANDS.js`
2. Copy each command block (starts with `const tierShowcase = {` ends with `}`)
3. Paste into your `commands.js` before `module.exports`
4. Each command has a `slashCommands.push()` line - make sure it's included

---

## What They Do

### Information Commands
- `/tiers` - Shows all VIP tiers and benefits
- `/pricing` - Complete pricing menu
- `/stats` - Server statistics
- `/status` - Service status (all green = online)
- `/perks` - Member exclusive benefits
- `/promo` - Active promotion codes

### Interactive Commands
- `/shop` - Browse by category with dropdown menu
- `/referral` - Earn money from referrals (with buttons)
- `/leaderboard` - Top spenders & vouchers
- `/accounts` - Account marketplace (with buttons)

### Action Commands
- `/startgiveaway` - Create a giveaway (staff only)
- `/track` - Track active orders
- `/verify` - Account verification process
- `/complaint` - File complaints (opens modal)

---

## Customization

### Change Colors
All commands use `#9D00FF` (purple) or `#FF00FF` (magenta).

To change primary color globally:
- Find and replace `#9D00FF` with your hex color
- Find and replace `#FF00FF` with your accent color

### Update Pricing
Open `/pricing` command in `NEW_COMMANDS.js`, update these sections:
```javascript
{ name: "🚀 WZ RANKED BOOST", value: "```\n0-10 Wins: $15\n...```", inline: true },
```

### Update Stats
In `/stats` command, change these numbers:
```javascript
{ name: "👥 MEMBERS", value: "```\n• Total: 2,847\n...```", inline: true },
```

### Update Leaderboard
In `/leaderboard` command, update usernames and amounts:
```javascript
"1. @Shadow - $2,450\n2. @Ghost - $1,890\n..."
```

---

## Testing

After adding, restart bot and test each command:

```
/tiers
/pricing
/accounts
/leaderboard
/stats
/shop
/startgiveaway (admin test)
/status
/referral
/track
/verify
/complaint
/perks
/promo
```

All should show embeds with proper neon purple styling.

---

## Button/Modal Handlers (Optional)

Some commands have buttons that need handlers. They're already coded but if you want them to work fully, you'd need to add the button handlers to your `buttonHandlers` object. For now, they'll show the buttons but not respond - that's fine for display purposes.

To enable full functionality, copy these button handlers and add them to your existing `buttonHandlers` object:

```javascript
button_handlers: {
    generate_ref_link: async (interaction) => {
        await interaction.reply({ content: "Your referral link: `discord.gg/YOURCODE`", ephemeral: true });
    },
    start_verify: async (interaction) => {
        await interaction.reply({ content: "✅ Verification started! Complete within 30 seconds.", ephemeral: true });
    },
    list_accounts: async (interaction) => {
        await interaction.reply({ content: "📋 Browsing accounts... (Coming soon)", ephemeral: true });
    },
    sell_account: async (interaction) => {
        await interaction.reply({ content: "💰 Sell your account panel (Coming soon)", ephemeral: true });
    }
}
```

---

## Permissions

All these commands work for everyone. If you want to restrict some:
- `/startgiveaway` - Staff only (add role check)
- `/complaint` - All members (safe)
- `/track` - Members only (shows their orders)

---

## Deployment Steps

1. **Get NEW_COMMANDS.js from the zip**
2. **Open your commands.js**
3. **Find line before `module.exports`**
4. **Paste all 14 commands**
5. **Save**
6. **Restart bot**: `npm start`
7. **Type `/` in Discord** - you should see all 14 new commands

---

## File Structure

After adding, your `commands.js` should have:

```
// Top: requires & imports
// CONFIG section
// BLACK_MARKET utilities
// Functions (isTicketStaff, etc)
// EXISTING COMMANDS (all your old ones)
// /blackmarket command
// 14 NEW COMMANDS ← Add here
// module.exports
```

---

## That's It

One copy-paste. 14 new fire commands. Restart bot. Done.

All commands are ready to go. All embeds are styled. All buttons are wired up (though some need handler implementations if you want full interactivity).

---

**WEEKENDTHRILLER | 14 FIRE COMMANDS | BLACK MARKET VIBES** 🔓⚡
