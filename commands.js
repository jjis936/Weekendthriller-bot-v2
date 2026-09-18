// commands.js
// All slash command definitions AND their execute logic live here, plus the
// button/select-menu/modal handlers that go with them. This is intentionally
// one big file instead of a folder-per-thing - imported by both bot.js
// (to run everything) and deploy-commands.js (to register with Discord).

const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ChannelType,
    AuditLogEvent
} = require("discord.js");

const fs = require("fs");
const path = require("path");

// ---------------------------------------------------------------------------
// CONFIG (folded in here instead of a separate file)
// ---------------------------------------------------------------------------

const CONFIG = {
    BRAND_NAME: process.env.BRAND_NAME || "Weekendthriller Services",
    BRAND_EMOJI: "💎",
    COLOR: "#9D00FF",
    VOUCH_CHANNEL_ID: process.env.VOUCH_CHANNEL_ID || "1528153042539643013",
    LEAVE_VOUCH_CHANNEL_ID: process.env.LEAVE_VOUCH_CHANNEL_ID || "1509936235316252722", // no longer used by the vouch flow itself (kept in case other features reference it)

    SMS_SERVICES: [
        { label: "Telegram", value: "telegram" },
        { label: "WhatsApp", value: "whatsapp" },
        { label: "Google", value: "google" },
        { label: "Discord", value: "discord" },
        { label: "Facebook", value: "facebook" },
        { label: "Activision", value: "activision" }
    ],

    SMS_COUNTRIES: [
        { label: "USA", value: "usa", slugs: { "5sim": "usa", smspool: "usa" } },
        { label: "UK", value: "uk", slugs: { "5sim": "england", smspool: "uk" } },
        { label: "Russia", value: "russia", slugs: { "5sim": "russia", smspool: "russia" } },
        { label: "Indonesia", value: "indonesia", slugs: { "5sim": "indonesia", smspool: "indonesia" } },
        { label: "Philippines", value: "philippines", slugs: { "5sim": "philippines", smspool: "philippines" } }
    ],

    BRAND_ICON_URL: process.env.BRAND_ICON_URL || null,
    WEBSITE_URL: process.env.WEBSITE_URL || "https://weekendthrillers-services.base44.app",
    WELCOME_CHANNEL_ID: process.env.WELCOME_CHANNEL_ID || null,
    AUTOROLE_ID: process.env.AUTOROLE_ID || null,
    VERIFIED_ROLE_ID: process.env.VERIFIED_ROLE_ID || "1528469350703431700",
    TRANSCRIPT_CHANNEL_ID: process.env.TRANSCRIPT_CHANNEL_ID || null,
    RECAP_CHANNEL_ID: process.env.RECAP_CHANNEL_ID || null, // set this to auto-post a weekly recap every Monday
    CASHAPP_TAG: process.env.CASHAPP_TAG || "$EvanJoyner8",
    AI_SUPPORT_CHANNEL_ID: process.env.AI_SUPPORT_CHANNEL_ID || null,
    AI_NAME: process.env.AI_NAME || "Weekendthrillers AI",

    // -- Security features --
    SECURITY_LOG_CHANNEL_ID: process.env.SECURITY_LOG_CHANNEL_ID || null,
    APPLICATION_CHANNEL_ID: process.env.APPLICATION_CHANNEL_ID || null,
    NEW_ACCOUNT_MIN_AGE_DAYS: parseInt(process.env.NEW_ACCOUNT_MIN_AGE_DAYS) || 3,
    MAX_MENTIONS_PER_MESSAGE: parseInt(process.env.MAX_MENTIONS_PER_MESSAGE) || 6,
    ANTI_NUKE_ENABLED: process.env.ANTI_NUKE_ENABLED !== "false", // on by default
    ANTI_NUKE_THRESHOLD: parseInt(process.env.ANTI_NUKE_THRESHOLD) || 3, // deletes within window
    ANTI_NUKE_WINDOW_MS: 10000, // 10 seconds
    TICKET_COOLDOWN_MS: 60000, // 1 minute between ticket creations per user
    NUMBER_COOLDOWN_MS: 30000, // 30 seconds between number purchases per user

    TICKET_SERVICES: [
        { label: "Nuke Services", value: "nuke", emoji: { id: "1528171131700248676", animated: true } },
        { label: "WZ Ranked Boost", value: "wz_ranked", emoji: { id: "1528069396302659606" } },
        { label: "MP Ranked Boost", value: "mp_ranked", emoji: { id: "1528069396302659606" } },
        { label: "Camos", value: "camos", emoji: "🎨" },
        { label: "Number Rental", value: "number_rental", emoji: "📱" },
        { label: "Endgame Operators", value: "endgame", emoji: { id: "1530322984026243275" } },
        { label: "Middleman Service", value: "middleman", emoji: "🤝" },
        { label: "Pyroclast Scatter", value: "pyroclast", emoji: "🔫" }
    ],

    MIDDLEMAN_FEE_PERCENT: process.env.MIDDLEMAN_FEE_PERCENT || "10",

    // Role allowed to claim/manage ticket progress. Everyone can still close.
    TICKET_STAFF_ROLE_ID: process.env.TICKET_STAFF_ROLE_ID || "1509909558750089427",

    // If set, ONLY members with this role can run any slash command at all.
    // Leave the env var empty (or set to "false") to open the bot back up.
    ALLOWED_ROLE_ID: process.env.ALLOWED_ROLE_ID || "1509909558750089427",

    // Account-selling flow
    ACCOUNT_LISTING_START_CHANNEL_ID: process.env.ACCOUNT_LISTING_START_CHANNEL_ID || "1509936375749673071",
    ACCOUNT_LISTING_POST_CHANNEL_ID: process.env.ACCOUNT_LISTING_POST_CHANNEL_ID || "1548088293315584120"
};

function isTicketStaff(member){
    return member.roles.cache.has(CONFIG.TICKET_STAFF_ROLE_ID);
}

function countrySlug(value, provider){
    const entry = CONFIG.SMS_COUNTRIES.find(c => c.value === value);
    return entry ? entry.slugs[provider] : value;
}

// Looks up a custom emoji by ID from an already-fetched emoji Collection.
// Use fetchGuildEmojis() once per command, then call this as many times as
// needed - much faster than re-fetching per lookup, and avoids blowing
// past Discord's 3-second interaction reply window.
function emojiTag(emojiCollection, id, fallbackLabel){
    const emoji = emojiCollection?.get(id);
    if(emoji) return emoji.toString();
    console.log(`[emoji] ⚠️ could not find emoji ${id} even after a fresh fetch - is the bot actually in the server that owns this emoji?`);
    return fallbackLabel || "";
}

// Fetches a guild's emoji list FRESH from Discord's API - not from the bot's
// cache. This matters because discord.js has a known quirk where newly
// created emoji don't get added to the cache until the bot restarts, even
// though the bot has full access to them. A fresh fetch always sees the
// current, real emoji list.
async function fetchGuildEmojis(guild){
    try{
        return await guild.emojis.fetch();
    }catch(err){
        console.log(`[emoji] ⚠️ could not fetch guild emoji list: ${err.message}`);
        return null;
    }
}

// ---------------------------------------------------------------------------
// /rankcalc data - 20 tiers, index 0-19. Every tier is $7 except Top 250.
// ---------------------------------------------------------------------------

const RANK_ARROW_EMOJI_ID = "1528350607021310054";

const RANK_TIERS = [
    { name: "Bronze 1", short: "B1", emojiId: "1528349678318387290", price: 7 },
    { name: "Bronze 2", short: "B2", emojiId: "1528349678318387290", price: 7 },
    { name: "Bronze 3", short: "B3", emojiId: "1528349678318387290", price: 7 },
    { name: "Silver 1", short: "S1", emojiId: "1528349825119027250", price: 7 },
    { name: "Silver 2", short: "S2", emojiId: "1528349825119027250", price: 7 },
    { name: "Silver 3", short: "S3", emojiId: "1528349825119027250", price: 7 },
    { name: "Gold 1", short: "G1", emojiId: "1528349951774556213", price: 7 },
    { name: "Gold 2", short: "G2", emojiId: "1528349951774556213", price: 7 },
    { name: "Gold 3", short: "G3", emojiId: "1528349951774556213", price: 7 },
    { name: "Platinum 1", short: "P1", emojiId: "1528350059647860839", price: 7 },
    { name: "Platinum 2", short: "P2", emojiId: "1528350059647860839", price: 7 },
    { name: "Platinum 3", short: "P3", emojiId: "1528350059647860839", price: 7 },
    { name: "Diamond 1", short: "D1", emojiId: "1528350158960595014", price: 7 },
    { name: "Diamond 2", short: "D2", emojiId: "1528350158960595014", price: 7 },
    { name: "Diamond 3", short: "D3", emojiId: "1528350158960595014", price: 7 },
    { name: "Crimson 1", short: "C1", emojiId: "1528350253886078996", price: 7 },
    { name: "Crimson 2", short: "C2", emojiId: "1528350253886078996", price: 7 },
    { name: "Crimson 3", short: "C3", emojiId: "1528350253886078996", price: 7 },
    { name: "Iridescent", short: "Iri", emojiId: "1528350360245375008", price: 7 },
    { name: "Top 250", short: "T250", emojiId: "1528350484761546813", price: 500 }
];

// Price to go from currentIndex+1 through desiredIndex inclusive
function calcRankPrice(currentIndex, desiredIndex){
    let total = 0;
    for(let i = currentIndex + 1; i <= desiredIndex; i++){
        total += RANK_TIERS[i].price;
    }
    return total;
}

function calcRankTime(rankCount){
    const hours = rankCount * 1;
    if(hours >= 24){
        const days = Math.floor(hours / 24);
        const remHours = hours % 24;
        return remHours ? `${days}d ${remHours}h` : `${days}d`;
    }
    return `${hours}h`;
}

// Text-based visual bar mirroring the website's tier chart - a colored
// square per tier (highlighting the range being climbed), with the short
// tier codes lined up underneath in a monospace code block.
function buildRankTierBar(currentIndex, desiredIndex){
    const squares = RANK_TIERS.map((tier, i) => {
        if(currentIndex !== null && i === currentIndex) return "🔵";       // starting point
        if(desiredIndex !== null && i === desiredIndex) return "🟢";       // target
        if(currentIndex !== null && desiredIndex !== null && i > currentIndex && i < desiredIndex) return "🟨"; // in the range being climbed
        return "⬛";
    }).join("");

    const labels = RANK_TIERS.map(t => t.short.padEnd(4)).join("");

    return `${squares}\n\`${labels}\`\n🔵 Current  🟨 Climbing  🟢 Desired`;
}

// Shared builders used by BOTH the /rankcalc command AND the global select
// handlers below - fully stateless. All state (current/desired rank) lives
// in the message's own component customIds/selected values, not in bot
// memory, so this survives bot restarts unlike a message collector would.

function buildRankCurrentSelect(emojis, selectedIndex){
    const menu = new StringSelectMenuBuilder()
        .setCustomId("rankcalc_current")
        .setPlaceholder("Current Rank");

    menu.addOptions(RANK_TIERS.map((tier, i) => {
        const opt = {
            label: tier.price >= 500 ? `${tier.name} — $500+` : tier.name,
            value: String(i),
            default: i === selectedIndex
        };
        const emojiObj = emojis?.get(tier.emojiId);
        if(emojiObj) opt.emoji = { id: emojiObj.id, animated: emojiObj.animated };
        return opt;
    }));

    return menu;
}

function buildRankDesiredSelect(emojis, currentIndex, selectedIndex){
    // The chosen current rank is encoded right into this menu's customId -
    // that's what makes this stateless. When this select fires, the handler
    // reads currentIndex straight out of its own customId, no stored state
    // needed anywhere.
    const customId = currentIndex === null ? "rankcalc_desired_none" : `rankcalc_desired_${currentIndex}`;
    const menu = new StringSelectMenuBuilder().setCustomId(customId);

    const valid = currentIndex === null ? [] : RANK_TIERS.map((_, i) => i).filter(i => i > currentIndex);

    if(!valid.length){
        menu.setPlaceholder(currentIndex === null ? "Pick a current rank first" : "No higher ranks available")
            .setDisabled(true)
            .addOptions([{ label: "N/A", value: "none" }]);
        return menu;
    }

    menu.setPlaceholder("Desired Rank");
    menu.addOptions(valid.map(i => {
        const tier = RANK_TIERS[i];
        const opt = {
            label: tier.price >= 500 ? `${tier.name} — $500+` : tier.name,
            value: String(i),
            default: i === selectedIndex
        };
        const emojiObj = emojis?.get(tier.emojiId);
        if(emojiObj) opt.emoji = { id: emojiObj.id, animated: emojiObj.animated };
        return opt;
    }));

    return menu;
}

function buildRankResultEmbed(arrow, currentIndex, desiredIndex){
    const current = currentIndex !== null ? RANK_TIERS[currentIndex] : null;
    const desired = desiredIndex !== null ? RANK_TIERS[desiredIndex] : null;

    let description;

    if(!current || !desired){
        description = "Pick a **current rank** and a **desired rank** below to see your price.";
    }else if(desiredIndex <= currentIndex){
        description = "⚠️ **Select a higher desired rank**";
    }else{
        const price = calcRankPrice(currentIndex, desiredIndex);
        const rankCount = desiredIndex - currentIndex;
        const time = calcRankTime(rankCount);

        description =
            `**${current.name} ${arrow} ${desired.name}**\n\n` +
            `💰 **Estimated Price:** $${price}\n` +
            `*$7 per rank | Top 250 $500+*\n\n` +
            `⏱ **Estimated Time:** ~${time}`;
    }

    const embed = brandEmbed({ title: "Rank Calculator", description, thumbnail: false });

    if(currentIndex !== null || desiredIndex !== null){
        embed.addFields({ name: "📊 Progress", value: buildRankTierBar(currentIndex, desiredIndex) });
    }

    return embed;
}

function buildRankComponents(emojis, currentIndex, desiredIndex){
    const row1 = new ActionRowBuilder().addComponents(buildRankCurrentSelect(emojis, currentIndex));
    const row2 = new ActionRowBuilder().addComponents(buildRankDesiredSelect(emojis, currentIndex, desiredIndex));
    const row3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("buy_rankboost").setLabel("Order Rank Boost").setStyle(ButtonStyle.Success)
    );
    return [row1, row2, row3];
}

// Reusable "Visit Website" link button row - link buttons need no customId
// and no interaction handler, Discord just opens the URL directly.
// Defensive: an invalid URL here would throw and crash the whole command
// before it ever gets to reply, so validate first and just skip the button
// if it's bad instead of taking down the entire panel.
function websiteRow(){
    try{
        const url = CONFIG.WEBSITE_URL;
        if(!url || !/^https?:\/\//i.test(url)){
            console.log(`[websiteRow] ⚠️ WEBSITE_URL is missing or invalid ("${url}") - skipping the link button`);
            return null;
        }
        return new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel("🌐 Visit Our Website")
                .setStyle(ButtonStyle.Link)
                .setURL(url)
        );
    }catch(err){
        console.log(`[websiteRow] ⚠️ could not build website button: ${err.message}`);
        return null;
    }
}

// Shared "house style" embed builder - every command uses this so they all
// look consistent instead of each one improvising its own layout.
function brandEmbed({ title, description, fields, thumbnail, color }){
    const embed = new EmbedBuilder()
        .setColor(color || CONFIG.COLOR)
        .setTitle(title)
        .setFooter({
            text: `${CONFIG.BRAND_NAME}`,
            iconURL: CONFIG.BRAND_ICON_URL || undefined
        })
        .setTimestamp();

    if(description) embed.setDescription(description);
    if(fields && fields.length) embed.addFields(fields);
    if(thumbnail !== false && CONFIG.BRAND_ICON_URL) embed.setThumbnail(CONFIG.BRAND_ICON_URL);

    return embed;
}

// -- Shared CashApp payment card (QR + link) - posted at the end of ticket
// setup for every service, and in the food-order flow. ----------------------
function buildCashAppPaymentCard(){

    const cashtag = CONFIG.CASHAPP_TAG.replace(/^\$/, "");
    const paymentLink = `https://cash.app/$${cashtag}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&color=0-214-50&bgcolor=0-0-0&data=${encodeURIComponent(paymentLink)}`;

    const embed = new EmbedBuilder()
        .setColor("#00D632")
        .setTitle("💵 CASHAPP PAYMENT")
        .setDescription(
            "```\n💸 SCAN TO PAY 💸\n```\n" +
            `**Cashtag:** \`$${cashtag}\`\n` +
            `**Link:** [${paymentLink}](${paymentLink})\n\n` +
            "📸 Scan the QR code below with your camera or the Cash App scanner, or tap the link above.\n\n" +
            "⚠️ **Please screenshot your payment confirmation and post it here once sent** — staff will confirm and get your order moving.\n\n" +
            "▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬"
        )
        .setImage(qrUrl)
        .setFooter({ text: `${CONFIG.BRAND_NAME} • Payments` })
        .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("payment_proof_upload").setLabel("💳 I've Sent Payment").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("payment_proof_confirm").setLabel("✅ Confirm Payment (Staff)").setStyle(ButtonStyle.Primary)
    );

    return { embed, row };
}

// -- Vouch system: shared "insane" embed builders so /panel, /setup and the
// actual posted vouch all look identical and stay in sync. -----------------

function buildVouchPanelEmbed(){
    const stats = vouchesDB.read();
    const avg = stats.totalVouches ? (stats.ratingSum / stats.totalVouches).toFixed(1) : "New";

    return new EmbedBuilder()
        .setColor("#FFD700")
        .setTitle("✨ SHARE YOUR EXPERIENCE ✨")
        .setDescription(
            "```\n🏆  CUSTOMER REVIEW CENTER  🏆\n```\n" +
            `Loved your order from **${CONFIG.BRAND_NAME}**? Let the world know — it takes less than a minute.\n\n` +
            "⭐ **Step 1** → Pick your star rating\n" +
            "💬 **Step 2** → Tell us about your experience\n" +
            "📸 **Step 3** → *(optional)* drop a screenshot for extra credibility\n\n" +
            "▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n" +
            `_Your review goes straight to <#${CONFIG.VOUCH_CHANNEL_ID}> and helps other customers trust us!_`
        )
        .addFields(
            { name: "📊 Total Vouches", value: `${stats.totalVouches}`, inline: true },
            { name: "⭐ Average Rating", value: `${avg}${stats.totalVouches ? "/5" : ""}`, inline: true }
        )
        .setFooter({ text: `${CONFIG.BRAND_NAME}`, iconURL: CONFIG.BRAND_ICON_URL || undefined })
        .setTimestamp();
}

function buildVouchResultEmbed({ user, rating, comment, totalVouches }){

    const stars = "⭐".repeat(rating) + "☆".repeat(5 - rating);
    const colors = { 5: "#FFD700", 4: "#43B581", 3: "#3498DB", 2: "#FF9900", 1: "#FF0000" };
    const tierLine = { 5: "🔥 LEGENDARY EXPERIENCE", 4: "✨ GREAT EXPERIENCE", 3: "👍 SOLID EXPERIENCE", 2: "😕 MIXED EXPERIENCE", 1: "⚠️ NEEDS IMPROVEMENT" }[rating];

    const embed = new EmbedBuilder()
        .setColor(colors[rating] || CONFIG.COLOR)
        .setAuthor({ name: `${user.tag}`, iconURL: user.displayAvatarURL() })
        .setTitle(`${stars}`)
        .setDescription(
            `### ${tierLine}\n\n` +
            `> ${comment.replace(/\n/g, "\n> ")}\n\n` +
            "▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n" +
            `✅ **VERIFIED CUSTOMER** • ${CONFIG.BRAND_NAME}`
        )
        .setFooter({ text: `Vouch #${totalVouches} • ${CONFIG.BRAND_NAME}`, iconURL: CONFIG.BRAND_ICON_URL || undefined })
        .setTimestamp();

    if(totalVouches % 25 === 0){
        embed.addFields({ name: "🎉 MILESTONE", value: `This is our **${totalVouches}th** vouch! Thank you for the support!` });
    }

    return embed;
}

// ---------------------------------------------------------------------------
// TINY JSON DATA LAYER (one folder, one helper, every feature reuses it)
// ---------------------------------------------------------------------------

function db(name, fallback){
    const file = path.join(__dirname, `data-${name}.json`);
    if(!fs.existsSync(file)){
        fs.writeFileSync(file, JSON.stringify(fallback, null, 2));
    }
    return {
        read: () => JSON.parse(fs.readFileSync(file, "utf8")),
        write: (data) => fs.writeFileSync(file, JSON.stringify(data, null, 2))
    };
}

const vouchesDB = db("vouches", { entries: [], totalVouches: 0, ratingSum: 0 });
const usersDB = db("users", {});               // { [userId]: { vouches } }
const giveawaysDB = db("giveaways", {});        // { [messageId]: {...} }
const warningsDB = db("warnings", {});          // { [userId]: [reasons] }
const numbersDB = db("numbers", { orders: [], counter: 1 });
const ticketLogDB = db("tickets", { open: [] });
const applicationsDB = db("applications", { entries: [], counter: 1 });
const discountsDB = db("discounts", {}); // { code: { percent, usesLeft, createdBy } }
const custompanelsDB = db("custompanels", {}); // { slug: { title, buttonLabel } } - built by /custompanel
const thrillerPanelsDB = db("thrillerpanels", {}); // { panelId: { products: [{label,value}] } } - built by /thrillerpanel
const waitlistDB = db("waitlist", {}); // { serviceName: [userId, userId, ...] }
const notesDB = db("notes", {}); // { userId: [{ staffId, note, at }] }
const blacklistDB = db("blacklist", {}); // { userId: { reason, addedBy, at } }
const ordersDB = db("orders", { counter: 1000 }); // just a running counter for order IDs
const stockDB = db("stock", {}); // { serviceName: "in_stock" | "limited" | "sold_out" }
const scheduleDB = db("schedule", []); // [{ id, channelId, postAt, title, message, style }]
const referralsDB = db("referrals", {}); // { code: { owner, uses: [] } }

// In-memory only - short-lived selections while a user clicks through
// the number-rental dropdowns. No need to persist this to disk.
const smsSessions = new Map();

// Tracks users who've posted vouch text but haven't added a proof photo yet.
// userId -> { content, timestamp, textMessageId, timer }

// ---------------------------------------------------------------------------
// SECURITY: cooldown tracking + anti-nuke state (all in-memory)
// ---------------------------------------------------------------------------

const ticketCooldowns = new Map();   // userId -> timestamp of last ticket created
const numberCooldowns = new Map();   // userId -> timestamp of last number purchased
const verifySessions = new Map();    // userId -> { order: [emoji,emoji,emoji,emoji], correctIndex, expires }
const vouchSessions = new Map();     // channelId -> { userId, rating, comment }

const VERIFY_EMOJI_POOL = ["🍀", "🔥", "⚡", "💎", "🎯", "🛡️", "🚀", "🌙", "⭐", "🍉", "🎮", "🧩", "🦾", "🌊", "🔑"];

// Shared FAQ catalog - used by both /faq (select menu) and /faqsearch (autocomplete)
const FAQ_CATALOG = [
    { value: "faq_time", question: "How long does a boost take?", emoji: "⏱️", answer: "Most boosts complete within a few hours depending on rank distance and queue. Rank Boosts are typically same-day; Nuke orders are scheduled with you directly since they're manually piloted via Battlenet." },
    { value: "faq_safety", question: "Is my account safe?", emoji: "🔒", answer: "We never ask for your password over chat outside of an active, staff-claimed ticket, and boosts are done carefully to avoid unnecessary risk. If anything feels off, stop and open a ticket immediately." },
    { value: "faq_payment", question: "What payment methods do you accept?", emoji: "💳", answer: "Check the payment-methods channel for current accepted methods - these can change, so that channel is always the source of truth." },
    { value: "faq_refunds", question: "Do you offer refunds?", emoji: "↩️", answer: "Refunds are handled case-by-case through a ticket - if a service can't be delivered as described, staff will work it out with you there." },
    { value: "faq_numbers", question: "How does number rental work?", emoji: "📱", answer: "Use `/getnumber` or `/gen` to rent a temporary number for SMS verification. You'll get a real phone number, a code shows up when the target site texts it, and the order auto-refunds if no code arrives in time." }
];

// Shared service catalog - used by /bundle, /compare, and /pricecheck
const SERVICE_CATALOG = [
    { value: "nuke_1", label: "☢️ Nuke (1x)", price: "$79.99", turnaround: "Same-day (scheduled)", reward: "Nuke calling card, spray, camo & operator" },
    { value: "rank_full", label: "⚔️ Rank Boost (Full - Bronze → Iridescent)", price: "$250", turnaround: "1-3 days", reward: "Bronze → Iridescent rank" },
    { value: "camo_full", label: "🎨 Camo Grinding (Full Path)", price: "$120", turnaround: "3-5 days", reward: "Full mastery camo path" },
    { value: "endgame", label: "⚡ Endgame Operator", price: "$45", turnaround: "Same-day", reward: "Unlocked endgame operator skin" },
    { value: "number", label: "📱 Number Rental", price: "$5", turnaround: "Instant", reward: "Temporary SMS-verification number" },
    { value: "middleman", label: "🤝 Middleman Service", price: `${CONFIG.MIDDLEMAN_FEE_PERCENT}% fee`, turnaround: "Instant setup", reward: "Safe cash trade handling" }
];

function buildVerifyChallenge(){
    const pool = [...VERIFY_EMOJI_POOL].sort(() => Math.random() - 0.5).slice(0, 4);
    const correctIndex = Math.floor(Math.random() * 4);
    return { order: pool, correctIndex, target: pool[correctIndex] };
}
const deleteTracker = new Map();     // executorId -> { count, firstAt }

async function securityLog(guild, { title, description, color }){
    if(!CONFIG.SECURITY_LOG_CHANNEL_ID) return;
    const channel = await guild.channels.fetch(CONFIG.SECURITY_LOG_CHANNEL_ID).catch(() => null);
    if(!channel) return;

    await channel.send({
        embeds: [brandEmbed({ title: title || "🛡️ Security Alert", description, color: color || "#FF0000" })]
    }).catch(err => console.log(`[security] could not post to security log: ${err.message}`));
}

// ---------------------------------------------------------------------------
// PROVIDERS (5sim / SMSPool) - kept inline, not separate files
// ---------------------------------------------------------------------------

const providers = {

    async fivesimBuy(country, service){
        const res = await fetch(
            `https://5sim.net/v1/user/buy/activation/${country}/any/${service}`,
            { headers: { Authorization: `Bearer ${process.env.FIVESIM_API_KEY}` } }
        );
        const data = await res.json();
        if(!res.ok) throw new Error(data.message || "5sim purchase failed");
        return { orderId: data.id, phone: data.phone };
    },

    async fivesimCheck(orderId){
        const res = await fetch(
            `https://5sim.net/v1/user/check/${orderId}`,
            { headers: { Authorization: `Bearer ${process.env.FIVESIM_API_KEY}` } }
        );
        const data = await res.json();
        const last = Array.isArray(data.sms) && data.sms.length ? data.sms[data.sms.length - 1] : null;
        return { status: data.status, code: last ? last.code : null };
    },

    async fivesimCancel(orderId){
        const res = await fetch(
            `https://5sim.net/v1/user/cancel/${orderId}`,
            { headers: { Authorization: `Bearer ${process.env.FIVESIM_API_KEY}` } }
        );
        return res.json();
    },

    async smspoolBuy(country, service){
        const params = new URLSearchParams({ key: process.env.SMSPOOL_API_KEY, country, service });
        const res = await fetch("https://api.smspool.net/purchase/sms", { method: "POST", body: params });
        const data = await res.json();
        if(data.success !== 1) throw new Error(data.message || "SMSPool purchase failed");
        return { orderId: data.order_id, phone: data.phonenumber };
    },

    async smspoolCheck(orderId){
        const params = new URLSearchParams({ key: process.env.SMSPOOL_API_KEY, orderid: orderId });
        const res = await fetch("https://api.smspool.net/sms/check", { method: "POST", body: params });
        const data = await res.json();
        return { status: data.status, code: data.sms || null };
    },

    async smspoolResend(orderId){
        const params = new URLSearchParams({ key: process.env.SMSPOOL_API_KEY, orderid: orderId });
        const res = await fetch("https://api.smspool.net/sms/resend", { method: "POST", body: params });
        return res.json();
    },

    async smspoolCancel(orderId){
        const params = new URLSearchParams({ key: process.env.SMSPOOL_API_KEY, orderid: orderId });
        const res = await fetch("https://api.smspool.net/sms/cancel", { method: "POST", body: params });
        return res.json();
    }

};

// ---------------------------------------------------------------------------
// AI SUPPORT ASSISTANT (Claude API) - the 24/7 backup when the site is down
// ---------------------------------------------------------------------------

const AI_SYSTEM_PROMPT = `You are ${CONFIG.AI_NAME}, the 24/7 support assistant for ${CONFIG.BRAND_NAME}, a Call of Duty boosting and services business. You answer questions about:
- Boosting services: WZ Ranked Boost, MP Ranked Boost, Nuke Services, Camos
- Number Rental (temporary phone numbers for SMS verification via 5sim/SMSPool)
- Pricing questions (give general guidance, tell them to check #pricing-for-boosting or open a ticket for exact quotes)
- Account safety (boosting is done securely, customer accounts are handled carefully)
- SMS code issues (if a code doesn't work: try resending/re-requesting from the target site using the same number, wait a few minutes, or the number may need to be replaced if it's dirty/flagged)

Keep answers short (2-4 sentences), friendly, and confident. For anything involving an actual order, payment, or account-specific issue, direct them to open a ticket in #tickets so staff can help directly - you can't process orders or payments yourself. If you don't know something specific to this business, say so honestly and point them to a ticket instead of guessing.`;

async function askAI(question){

    if(!process.env.GEMINI_API_KEY){
        return "⚠️ AI support isn't configured yet - staff needs to set GEMINI_API_KEY. Please open a ticket instead.";
    }

    // Configurable so a future Google model deprecation doesn't silently
    // break this again - just set GEMINI_MODEL in Railway to switch models.
    // gemini-3.1-flash-lite is the current (2026) cost-effective pick for
    // short, simple support-chat replies like these.
    const model = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";

    try{
        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    systemInstruction: { parts: [{ text: AI_SYSTEM_PROMPT }] },
                    contents: [{ role: "user", parts: [{ text: question }] }],
                    generationConfig: { maxOutputTokens: 400 }
                })
            }
        );

        const data = await res.json();

        if(!res.ok){
            // Log the REAL error Google sent back - "hit an error" alone tells
            // us nothing. This will show the actual reason: bad key, quota,
            // wrong model, region block, etc.
            console.log(`[ai-support] ❌ Gemini API error (status ${res.status}): ${JSON.stringify(data)}`);
            return `⚠️ AI support hit an error. Please open a ticket in #tickets instead.`;
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if(!text){
            console.log(`[ai-support] ⚠️ No text in Gemini response: ${JSON.stringify(data)}`);
        }
        return text || "⚠️ Got an unexpected response. Please open a ticket instead.";

    }catch(err){
        console.log(`[ai-support] ❌ Network/request error: ${err.message}`);
        return "⚠️ AI support is temporarily unreachable. Please open a ticket in #tickets instead.";
    }

}

// ---------------------------------------------------------------------------
// SLASH COMMANDS
// ---------------------------------------------------------------------------

const slashCommands = [

    // -- Vouch panel (posts the "Leave a Vouch" button) --------------------
    {
        data: new SlashCommandBuilder()
            .setName("panel")
            .setDescription("Post the Weekendthriller Services vouch panel")
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

        async execute(interaction){

            const button = new ButtonBuilder()
                .setCustomId("leave_vouch")
                .setLabel("📝 Leave a Vouch")
                .setEmoji("⭐")
                .setStyle(ButtonStyle.Danger);

            await interaction.reply({
                embeds: [buildVouchPanelEmbed()],
                components: [new ActionRowBuilder().addComponents(button), websiteRow()].filter(Boolean)
            });

        }
    },

    // -- Verification panel ---------------------------------------------------
    {
        data: new SlashCommandBuilder()
            .setName("verify")
            .setDescription("Post the member verification panel")
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

        async execute(interaction){

            const emojis = await fetchGuildEmojis(interaction.guild);
            const arrow = emojiTag(emojis, RANK_ARROW_EMOJI_ID, "➡️");

            const embed = brandEmbed({
                title: `✅ Verify to Enter ${CONFIG.BRAND_NAME}`,
                description:
                    `Welcome! Click the button below to verify and unlock the rest of the server.\n\n` +
                    `${arrow} One click, instant access\n` +
                    `${arrow} No personal info needed - just confirms you're a real person\n` +
                    `${arrow} You'll get access to tickets, vouches, and everything else right after`,
                thumbnail: false
            });

            const button = new ButtonBuilder()
                .setCustomId("verify_button")
                .setLabel("Verify")
                .setEmoji("✅")
                .setStyle(ButtonStyle.Success);

            await interaction.reply({
                embeds: [embed],
                components: [new ActionRowBuilder().addComponents(button)]
            });

        }
    },

    // -- Cloudflare-style human verification panel (2-step emoji challenge) --
    {
        data: new SlashCommandBuilder()
            .setName("verifypanel")
            .setDescription("Post the advanced 2-step human verification panel")
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

        async execute(interaction){

            const embed = brandEmbed({
                title: "☁️ Cloudflare-Style Security Check",
                color: "#F6821F",
                thumbnail: false,
                description:
                    `**${CONFIG.BRAND_NAME}** protects this server with layered, Turnstile-style bot filtering.\n` +
                    `Complete the quick 2-step human check below to unlock full access.`,
                fields: [
                    {
                        name: "🛡️ Protection Features",
                        value:
                            "🌐 Cloudflare-style Turnstile bot filtering\n" +
                            "🔐 2-Step Verification Challenge\n" +
                            "🤖 Anti-Raid & Anti-Bot Shield\n" +
                            "⚡ Encrypted Session Handshake\n" +
                            "✅ Instant Role Grant on Success"
                    },
                    {
                        name: "📋 How It Works",
                        value:
                            "1️⃣ Click **Start Verification**\n" +
                            "2️⃣ Match the emoji shown to confirm you're human\n" +
                            "3️⃣ Get instantly verified & unlocked 🎉"
                    }
                ]
            });

            const startButton = new ButtonBuilder()
                .setCustomId("verify_start")
                .setLabel("Start Verification")
                .setEmoji("🔐")
                .setStyle(ButtonStyle.Success);

            await interaction.reply({
                embeds: [embed],
                components: [new ActionRowBuilder().addComponents(startButton)]
            });

        }
    },

    // -- Ticket panel -------------------------------------------------------
    {
        data: new SlashCommandBuilder()
            .setName("ticketpanel")
            .setDescription("Post the support/order ticket panel")
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

        async execute(interaction){

            const embed = brandEmbed({
                title: "Choose Your Service",
                description: `Select an option below and a private ticket will be created just for you.`,
                fields: [
                    {
                        name: "How it works",
                        value: "1️⃣ Pick a service from the dropdown\n2️⃣ A private channel opens for you\n3️⃣ Staff will claim & assist you there"
                    }
                ]
            });

            const menu = new StringSelectMenuBuilder()
                .setCustomId("ticket_select")
                .setPlaceholder("Services")
                .addOptions(CONFIG.TICKET_SERVICES.map(s => ({
                    label: s.label, value: s.value, emoji: s.emoji
                })));

            await interaction.reply({
                embeds: [embed],
                components: [new ActionRowBuilder().addComponents(menu), websiteRow()].filter(Boolean)
            });

        }
    },

    // -- Middleman service panel ---------------------------------------------
    {
        data: new SlashCommandBuilder()
            .setName("middleman")
            .setDescription("Post the middleman service panel")
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

        async execute(interaction){

            const embed = brandEmbed({
                title: "🤝 MIDDLE MAN Service",
                description:
                    `Middle Man Service\n\n` +
                    `If you are afraid to get scammed using cash trades or just can't sell your items?\n` +
                    `Then this is the perfect opportunity for you!\n` +
                    `I am offering a full middleman service which means I will be doing your cash trades.`,
                fields: [
                    { name: "\u200b", value: `» service fees : ${CONFIG.MIDDLEMAN_FEE_PERCENT}%` }
                ],
                thumbnail: false
            });

            const button = new ButtonBuilder()
                .setCustomId("buy_middleman")
                .setLabel("purchase middleman")
                .setEmoji("🤝")
                .setStyle(ButtonStyle.Danger);

            await interaction.reply({
                embeds: [embed],
                components: [new ActionRowBuilder().addComponents(button)]
            });

        }
    },

    // -- Sell-account listing panel -------------------------------------------
    {
        data: new SlashCommandBuilder()
            .setName("sellaccount")
            .setDescription("Post the account listing panel")
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

        async execute(interaction){

            const embed = brandEmbed({
                title: "🎮 Sell Your COD Account",
                description: "Looking to sell your account? Fill out the details below and we'll list it for buyers to see.",
                fields: [
                    { name: "How it works", value:
                        "1️⃣ Click the button and fill in title, description & price\n" +
                        "2️⃣ Upload 1-5 screenshots of the account here when asked\n" +
                        "3️⃣ Your listing is posted automatically for buyers"
                    }
                ]
            });

            const button = new ButtonBuilder()
                .setCustomId("sell_account_start")
                .setLabel("Sell Your Account")
                .setEmoji("🎮")
                .setStyle(ButtonStyle.Success);

            await interaction.reply({
                embeds: [embed],
                components: [new ActionRowBuilder().addComponents(button)]
            });

        }
    },

    // -- Community food order panel: opens a private ticket that posts a
    // CashApp payment card with a scannable QR code --------------------------
    {
        data: new SlashCommandBuilder()
            .setName("foodorder")
            .setDescription("Post the community food order panel")
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

        async execute(interaction){

            const embed = new EmbedBuilder()
                .setColor("#FF7A00")
                .setTitle("🍔 COMMUNITY FOOD ORDER")
                .setDescription(
                    "```\n🔥 GROUP ORDER KITCHEN 🔥\n```\n" +
                    "Tap the button below to start a private food order — a member of staff will help you place it and take payment securely.\n\n" +
                    "💡 **ORDER TIP**\n" +
                    "The sweet spot is **$25 or less** for the best discount. Want to spend more than $25? It's best to make **separate orders**.\n\n" +
                    "▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬"
                )
                .setFooter({ text: `${CONFIG.BRAND_NAME} • Food System` })
                .setTimestamp();

            const button = new ButtonBuilder()
                .setCustomId("foodorder_start")
                .setLabel("Start Food Order")
                .setEmoji("🍔")
                .setStyle(ButtonStyle.Primary);

            await interaction.reply({
                embeds: [embed],
                components: [new ActionRowBuilder().addComponents(button)]
            });

        }
    },

    // -- Pyroclast Scatter camo unlock ticket panel ---------------------------
    {
        data: new SlashCommandBuilder()
            .setName("pyroclast")
            .setDescription("Post the Pyroclast Scatter camo unlock panel")
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
            .addStringOption(o => o.setName("price").setDescription("Price to show (e.g. Custom Price €/£)").setRequired(false))
            .addAttachmentOption(o => o.setName("image").setDescription("Weapon showcase image for the bottom of the panel").setRequired(false)),

        async execute(interaction){

            const price = interaction.options.getString("price") || "Custom Price €/£";
            const image = interaction.options.getAttachment("image");

            const embed = brandEmbed({
                title: "Pyroclast Scatter",
                thumbnail: false,
                description:
                    "🟢 Unlocked after completing 4 mastery camos!\n" +
                    "🟢 We will give you the best camo deal possible!\n" +
                    "🟢 All Platforms & Regions Supported!\n" +
                    "🟢 Fastest delivery & Best Prices!\n" +
                    "👑 WE PRICE-MATCH ANYONE!\n" +
                    "👑 AND WE GIVE YOU A BETTER PRICE!\n\n" +
                    `🔫 **Pyroclast Scatter - FROM 0**\n` +
                    `💷 PRICE ➤ ${price}\n\n` +
                    "🕐 SAME DAY STARTING TIME!\n" +
                    "🔥 DISCOUNTED IF YOU HAVE PROGRESS!"
            }).setFooter({ text: `${CONFIG.BRAND_NAME}'s Services` });

            const files = [];
            if(image){
                embed.setImage(`attachment://${image.name}`);
                files.push(image.url);
            }

            const button = new ButtonBuilder()
                .setCustomId("buy_pyroclast")
                .setLabel("Open Pyroclast Scatter Ticket")
                .setEmoji("🔵")
                .setStyle(ButtonStyle.Primary);

            await interaction.reply({
                embeds: [embed],
                files,
                components: [new ActionRowBuilder().addComponents(button)]
            });

        }
    },

    // -- Build-your-own ticket panel (asks questions one at a time, vertical
    // modal flow, then an image prompt - instead of one cluttered command) --
    {
        data: new SlashCommandBuilder()
            .setName("custompanel")
            .setDescription("Staff: build a custom ticket panel step-by-step")
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

        async execute(interaction){

            const modal = new ModalBuilder()
                .setCustomId("custompanel_form")
                .setTitle("Build a Custom Panel");

            const titleInput = new TextInputBuilder()
                .setCustomId("cp_title")
                .setLabel("Panel Title")
                .setPlaceholder("e.g. Damascus Camo")
                .setStyle(TextInputStyle.Short)
                .setMaxLength(100)
                .setRequired(true);

            const slugInput = new TextInputBuilder()
                .setCustomId("cp_slug")
                .setLabel("Short Unique ID (no spaces)")
                .setPlaceholder("e.g. damascus")
                .setStyle(TextInputStyle.Short)
                .setMaxLength(30)
                .setRequired(true);

            const priceInput = new TextInputBuilder()
                .setCustomId("cp_price")
                .setLabel("Price Line")
                .setPlaceholder("e.g. FROM $25")
                .setStyle(TextInputStyle.Short)
                .setMaxLength(50)
                .setRequired(true);

            const featuresInput = new TextInputBuilder()
                .setCustomId("cp_features")
                .setLabel("Features (one per line)")
                .setPlaceholder("Fast delivery\nAll platforms supported\nPrice match guarantee")
                .setStyle(TextInputStyle.Paragraph)
                .setMaxLength(1000)
                .setRequired(true);

            const buttonLabelInput = new TextInputBuilder()
                .setCustomId("cp_button_label")
                .setLabel("Button Text (optional)")
                .setPlaceholder("Open Ticket")
                .setStyle(TextInputStyle.Short)
                .setMaxLength(80)
                .setRequired(false);

            modal.addComponents(
                new ActionRowBuilder().addComponents(titleInput),
                new ActionRowBuilder().addComponents(slugInput),
                new ActionRowBuilder().addComponents(priceInput),
                new ActionRowBuilder().addComponents(featuresInput),
                new ActionRowBuilder().addComponents(buttonLabelInput)
            );

            await interaction.showModal(modal);

        }
    },

    // -- Same as /custompanel, but the final asset is an uploaded video
    // instead of a picture (e.g. gameplay clip / camo showcase). ------------
    {
        data: new SlashCommandBuilder()
            .setName("custompanelvideo")
            .setDescription("Staff: build a custom ticket panel with a video instead of a picture")
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

        async execute(interaction){

            const modal = new ModalBuilder()
                .setCustomId("custompanelvideo_form")
                .setTitle("Build a Custom Panel (Video)");

            const titleInput = new TextInputBuilder()
                .setCustomId("cp_title")
                .setLabel("Panel Title")
                .setPlaceholder("e.g. Damascus Camo")
                .setStyle(TextInputStyle.Short)
                .setMaxLength(100)
                .setRequired(true);

            const slugInput = new TextInputBuilder()
                .setCustomId("cp_slug")
                .setLabel("Short Unique ID (no spaces)")
                .setPlaceholder("e.g. damascus")
                .setStyle(TextInputStyle.Short)
                .setMaxLength(30)
                .setRequired(true);

            const priceInput = new TextInputBuilder()
                .setCustomId("cp_price")
                .setLabel("Price Line")
                .setPlaceholder("e.g. FROM $25")
                .setStyle(TextInputStyle.Short)
                .setMaxLength(50)
                .setRequired(true);

            const featuresInput = new TextInputBuilder()
                .setCustomId("cp_features")
                .setLabel("Features (one per line)")
                .setPlaceholder("Fast delivery\nAll platforms supported\nPrice match guarantee")
                .setStyle(TextInputStyle.Paragraph)
                .setMaxLength(1000)
                .setRequired(true);

            const buttonLabelInput = new TextInputBuilder()
                .setCustomId("cp_button_label")
                .setLabel("Button Text (optional)")
                .setPlaceholder("Open Ticket")
                .setStyle(TextInputStyle.Short)
                .setMaxLength(80)
                .setRequired(false);

            modal.addComponents(
                new ActionRowBuilder().addComponents(titleInput),
                new ActionRowBuilder().addComponents(slugInput),
                new ActionRowBuilder().addComponents(priceInput),
                new ActionRowBuilder().addComponents(featuresInput),
                new ActionRowBuilder().addComponents(buttonLabelInput)
            );

            await interaction.showModal(modal);

        }
    },

    // -- THRILLER.exe style "marketplace listing" panel with a product
    // dropdown - reusable anytime, vertical modal flow like /custompanel --
    {
        data: new SlashCommandBuilder()
            .setName("thrillerpanel")
            .setDescription("Post a THRILLER.exe style listing panel with a product dropdown")
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

        async execute(interaction){

            const modal = new ModalBuilder()
                .setCustomId("thrillerpanel_form")
                .setTitle("Build a THRILLER.exe Listing");

            const titleInput = new TextInputBuilder()
                .setCustomId("tp_title")
                .setLabel("Listing Title")
                .setPlaceholder("e.g. CALL OF DUTY - BOOSTING SERVICES")
                .setStyle(TextInputStyle.Short)
                .setMaxLength(100)
                .setRequired(true);

            const descInput = new TextInputBuilder()
                .setCustomId("tp_description")
                .setLabel("Description")
                .setPlaceholder("A short paragraph about this listing category")
                .setStyle(TextInputStyle.Paragraph)
                .setMaxLength(500)
                .setRequired(true);

            const priceStockInput = new TextInputBuilder()
                .setCustomId("tp_price_stock")
                .setLabel("Price | Stock (separate with |)")
                .setPlaceholder("$45.00 | UNLIMITED")
                .setStyle(TextInputStyle.Short)
                .setMaxLength(100)
                .setRequired(true);

            const productsInput = new TextInputBuilder()
                .setCustomId("tp_products")
                .setLabel("Products (one per line)")
                .setPlaceholder("WZ-Boost\nMastery Camos\nMultiplayer Rank\nPrestige Master\nCOD Points\nMiddleman")
                .setStyle(TextInputStyle.Paragraph)
                .setMaxLength(1000)
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(titleInput),
                new ActionRowBuilder().addComponents(descInput),
                new ActionRowBuilder().addComponents(priceStockInput),
                new ActionRowBuilder().addComponents(productsInput)
            );

            await interaction.showModal(modal);

        }
    },

    // -- Vouch stats ----------------------------------------------------------
    {
        data: new SlashCommandBuilder()
            .setName("vouchstats")
            .setDescription("View vouch statistics"),

        async execute(interaction){

            const stats = vouchesDB.read();
            const avg = stats.totalVouches
                ? (stats.ratingSum / stats.totalVouches).toFixed(1)
                : "0.0";

            const embed = brandEmbed({
                title: `${CONFIG.BRAND_NAME} Statistics`,
                fields: [
                    { name: "📊 Total Vouches", value: `${stats.totalVouches}` },
                    { name: "⭐ Average Rating", value: `${avg}/5` },
                    { name: "🏆 Reputation", value: avg >= 4.5 ? "Excellent ⭐⭐⭐⭐⭐" : "Growing ⭐⭐⭐⭐" }
                ]
            });

            await interaction.reply({ embeds: [embed] });

        }
    },

    // -- Leaderboard ----------------------------------------------------------
    {
        data: new SlashCommandBuilder()
            .setName("leaderboard")
            .setDescription("Top customers by vouch count"),

        async execute(interaction){

            const users = usersDB.read();

            const sorted = Object.entries(users)
                .sort((a, b) => (b[1].vouches || 0) - (a[1].vouches || 0))
                .slice(0, 10);

            const lines = sorted.length
                ? sorted.map(([id, u], i) => `**${i + 1}.** <@${id}> — ${u.vouches} vouches`).join("\n")
                : "No vouches yet.";

            const embed = brandEmbed({
                title: "🏆 Top Customers",
                description: lines
            });

            await interaction.reply({ embeds: [embed] });

        }
    },

    // -- Giveaway ---------------------------------------------------------
    {
        data: new SlashCommandBuilder()
            .setName("giveaway")
            .setDescription("Start a giveaway")
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
            .addStringOption(o => o.setName("prize").setDescription("What are you giving away").setRequired(true))
            .addIntegerOption(o => o.setName("minutes").setDescription("Duration in minutes").setRequired(true))
            .addIntegerOption(o => o.setName("winners").setDescription("How many winners (default 1)").setRequired(false)),

        async execute(interaction){

            const prize = interaction.options.getString("prize");
            const minutes = interaction.options.getInteger("minutes");
            const winnerCount = Math.max(1, interaction.options.getInteger("winners") || 1);
            const endTime = Date.now() + minutes * 60000;

            const embed = brandEmbed({
                title: "🎉 Giveaway",
                color: "#b026ff",
                fields: [
                    { name: "🎁 Prize", value: prize },
                    { name: "🏆 Winners", value: `${winnerCount}` },
                    { name: "⏰ Ends", value: `<t:${Math.floor(endTime / 1000)}:R>` },
                    { name: "👥 Entries", value: "0" }
                ]
            });

            const enterButton = new ButtonBuilder()
                .setCustomId("giveaway_enter")
                .setLabel("🎉 Enter")
                .setStyle(ButtonStyle.Success);

            const entriesButton = new ButtonBuilder()
                .setCustomId("giveaway_entries")
                .setLabel("View Entries")
                .setEmoji("👥")
                .setStyle(ButtonStyle.Secondary);

            await interaction.reply({
                embeds: [embed],
                components: [new ActionRowBuilder().addComponents(enterButton, entriesButton)]
            });
            const msg = await interaction.fetchReply();

            const giveaways = giveawaysDB.read();
            giveaways[msg.id] = {
                prize, endTime, channelId: interaction.channel.id, entries: [], ended: false, winnerCount
            };
            giveawaysDB.write(giveaways);

        }
    },

    // -- Reroll a giveaway winner ---------------------------------------------
    {
        data: new SlashCommandBuilder()
            .setName("reroll")
            .setDescription("Staff: reroll a giveaway's winner using its message ID")
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
            .addStringOption(o => o.setName("message_id").setDescription("The giveaway message ID").setRequired(true)),

        async execute(interaction){
            if(!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)){
                return interaction.reply({ content: "❌ No permission.", ephemeral: true });
            }

            const messageId = interaction.options.getString("message_id");
            const giveaways = giveawaysDB.read();
            const g = giveaways[messageId];

            if(!g){
                return interaction.reply({ content: "❌ No giveaway found with that message ID.", ephemeral: true });
            }
            if(!g.entries.length){
                return interaction.reply({ content: "❌ That giveaway had no entries to reroll.", ephemeral: true });
            }

            const shuffled = [...g.entries].sort(() => 0.5 - Math.random());
            const newWinners = shuffled.slice(0, g.winnerCount || 1);

            await interaction.reply({
                content: `🎉 **Reroll!** New winner${newWinners.length > 1 ? "s" : ""} for **${g.prize}**: ${newWinners.map(id => `<@${id}>`).join(", ")}`
            });
        }
    },

    // -- Moderation: ban / kick / warn / timeout ---------------------------
    {
        data: new SlashCommandBuilder()
            .setName("ban")
            .setDescription("Ban a member")
            .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
            .addUserOption(o => o.setName("user").setDescription("User to ban").setRequired(true))
            .addStringOption(o => o.setName("reason").setDescription("Reason").setRequired(false)),

        async execute(interaction){
            if(!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)){
                return interaction.reply({ content: "❌ No permission.", ephemeral: true });
            }
            const user = interaction.options.getUser("user");
            const reason = interaction.options.getString("reason") || "No reason provided";
            const member = await interaction.guild.members.fetch(user.id).catch(() => null);
            if(!member){
                return interaction.reply({ content: "❌ User not found.", ephemeral: true });
            }
            await member.ban({ reason });
            await interaction.reply({ content: `🔨 Banned ${user.tag} — ${reason}` });
        }
    },
    {
        data: new SlashCommandBuilder()
            .setName("kick")
            .setDescription("Kick a member")
            .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
            .addUserOption(o => o.setName("user").setDescription("User to kick").setRequired(true))
            .addStringOption(o => o.setName("reason").setDescription("Reason").setRequired(false)),

        async execute(interaction){
            if(!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)){
                return interaction.reply({ content: "❌ No permission.", ephemeral: true });
            }
            const user = interaction.options.getUser("user");
            const reason = interaction.options.getString("reason") || "No reason provided";
            const member = await interaction.guild.members.fetch(user.id).catch(() => null);
            if(!member){
                return interaction.reply({ content: "❌ User not found.", ephemeral: true });
            }
            await member.kick(reason);
            await interaction.reply({ content: `👢 Kicked ${user.tag} — ${reason}` });
        }
    },
    {
        data: new SlashCommandBuilder()
            .setName("warn")
            .setDescription("Warn a member")
            .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
            .addUserOption(o => o.setName("user").setDescription("User to warn").setRequired(true))
            .addStringOption(o => o.setName("reason").setDescription("Reason").setRequired(true)),

        async execute(interaction){
            if(!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)){
                return interaction.reply({ content: "❌ No permission.", ephemeral: true });
            }
            const user = interaction.options.getUser("user");
            const reason = interaction.options.getString("reason");
            const warnings = warningsDB.read();
            warnings[user.id] = warnings[user.id] || [];
            warnings[user.id].push({ reason, at: new Date().toISOString() });
            warningsDB.write(warnings);
            await interaction.reply({ content: `⚠️ Warned ${user.tag} — ${reason} (total: ${warnings[user.id].length})` });
        }
    },
    {
        data: new SlashCommandBuilder()
            .setName("timeout")
            .setDescription("Timeout a member")
            .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
            .addUserOption(o => o.setName("user").setDescription("User to timeout").setRequired(true))
            .addIntegerOption(o => o.setName("minutes").setDescription("Duration in minutes").setRequired(true))
            .addStringOption(o => o.setName("reason").setDescription("Reason").setRequired(false)),

        async execute(interaction){
            if(!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)){
                return interaction.reply({ content: "❌ No permission.", ephemeral: true });
            }
            const user = interaction.options.getUser("user");
            const minutes = interaction.options.getInteger("minutes");
            const reason = interaction.options.getString("reason") || "No reason provided";
            const member = await interaction.guild.members.fetch(user.id).catch(() => null);
            if(!member){
                return interaction.reply({ content: "❌ User not found.", ephemeral: true });
            }
            await member.timeout(minutes * 60000, reason);
            await interaction.reply({ content: `⏳ Timed out ${user.tag} for ${minutes}m — ${reason}` });
        }
    },

    // -- SMS number rental --------------------------------------------------
    {
        data: new SlashCommandBuilder()
            .setName("getnumber")
            .setDescription("Rent a temporary phone number for SMS verification"),

        async execute(interaction){

            smsSessions.set(interaction.user.id, {});

            const embed = brandEmbed({
                title: "📱 Number Rental",
                description: "Pick a provider to get started."
            });

            const menu = new StringSelectMenuBuilder()
                .setCustomId("sms_provider_select")
                .setPlaceholder("Choose a provider...")
                .addOptions(
                    { label: "5sim", value: "5sim", emoji: "5️⃣" },
                    { label: "SMSPool", value: "smspool", emoji: "🌀" }
                );

            await interaction.reply({
                embeds: [embed],
                components: [new ActionRowBuilder().addComponents(menu), websiteRow()].filter(Boolean),
                ephemeral: true
            });

        }
    },
    {
        data: new SlashCommandBuilder()
            .setName("numberlog")
            .setDescription("Staff: view recent SMS number rental orders")
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

        async execute(interaction){
            if(!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)){
                return interaction.reply({ content: "❌ No permission.", ephemeral: true });
            }
            const { orders } = numbersDB.read();
            const recent = orders.slice(-10).reverse();
            const lines = recent.length
                ? recent.map(o => `**${o.id}** • <@${o.buyer}> • ${o.provider} • ${o.service}/${o.country} • ${o.status}`).join("\n")
                : "No orders yet.";
            const embed = brandEmbed({
                title: "🧾 Recent Number Orders",
                description: lines
            });
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },

    // -- Fast-path number generation (no clicking through dropdowns) -------
    {
        data: new SlashCommandBuilder()
            .setName("gen")
            .setDescription("Quickly generate a number - skips the dropdown menus")
            .addStringOption(o => o.setName("provider").setDescription("Provider").setRequired(true)
                .addChoices({ name: "5sim", value: "5sim" }, { name: "SMSPool", value: "smspool" }))
            .addStringOption(o => o.setName("service").setDescription("Service").setRequired(true)
                .addChoices(...CONFIG.SMS_SERVICES.map(s => ({ name: s.label, value: s.value }))))
            .addStringOption(o => o.setName("country").setDescription("Region").setRequired(true)
                .addChoices(...CONFIG.SMS_COUNTRIES.map(c => ({ name: c.label, value: c.value })))),

        async execute(interaction){

            const provider = interaction.options.getString("provider");
            const service = interaction.options.getString("service");
            const country = interaction.options.getString("country");

            const cooldownLeft = numberCooldowns.get(interaction.user.id);
            if(cooldownLeft && Date.now() - cooldownLeft < CONFIG.NUMBER_COOLDOWN_MS){
                const secondsLeft = Math.ceil((CONFIG.NUMBER_COOLDOWN_MS - (Date.now() - cooldownLeft)) / 1000);
                return interaction.reply({ content: `⏳ Please wait ${secondsLeft}s before buying another number.`, ephemeral: true });
            }

            await interaction.deferReply({ ephemeral: true });

            const slug = countrySlug(country, provider);
            let purchase;

            try{
                purchase = provider === "5sim"
                    ? await providers.fivesimBuy(slug, service)
                    : await providers.smspoolBuy(slug, service);
            }catch(err){
                return interaction.editReply({ content: `❌ Purchase failed: ${err.message}` });
            }

            const numbers = numbersDB.read();
            const orderId = "SN-" + String(numbers.counter).padStart(4, "0");
            numbers.orders.push({
                id: orderId, buyer: interaction.user.id, provider, service, country,
                phone: purchase.phone, providerOrderId: purchase.orderId,
                status: "pending", code: null, created: new Date().toISOString()
            });
            numbers.counter++;
            numbersDB.write(numbers);

            smsSessions.set(interaction.user.id, {
                provider, service, country,
                providerOrderId: purchase.orderId,
                localOrderId: orderId
            });
            numberCooldowns.set(interaction.user.id, Date.now());

            const embed = brandEmbed({
                title: "✅ Number Ready",
                fields: [
                    { name: "☎️ Number", value: `${purchase.phone}` },
                    { name: "🧾 Order", value: `${orderId}` }
                ]
            });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("sms_check").setLabel("📩 Check SMS").setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId("sms_resend").setLabel("🔁 Resend/Retry").setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId("sms_cancel").setLabel("🚫 Cancel & Refund").setStyle(ButtonStyle.Danger)
            );

            await interaction.editReply({ embeds: [embed], components: [row] });

        }
    },

    // -- Server info ----------------------------------------------------------
    {
        data: new SlashCommandBuilder()
            .setName("serverinfo")
            .setDescription("View stats about this server"),

        async execute(interaction){
            const g = interaction.guild;
            const embed = brandEmbed({
                title: `📊 ${g.name}`,
                thumbnail: false,
                fields: [
                    { name: "👥 Members", value: `${g.memberCount}` },
                    { name: "🚀 Boost Level", value: `${g.premiumTier}` },
                    { name: "💎 Boosts", value: `${g.premiumSubscriptionCount || 0}` },
                    { name: "📅 Created", value: `<t:${Math.floor(g.createdTimestamp / 1000)}:D>` },
                    { name: "😀 Emojis", value: `${g.emojis.cache.size}` },
                    { name: "🎭 Roles", value: `${g.roles.cache.size}` }
                ]
            });
            if(g.iconURL()) embed.setThumbnail(g.iconURL());
            await interaction.reply({ embeds: [embed] });
        }
    },

    // -- User info --------------------------------------------------------
    {
        data: new SlashCommandBuilder()
            .setName("userinfo")
            .setDescription("View info about a member")
            .addUserOption(o => o.setName("user").setDescription("Who to look up").setRequired(false)),

        async execute(interaction){
            const user = interaction.options.getUser("user") || interaction.user;
            const member = await interaction.guild.members.fetch(user.id).catch(() => null);

            const embed = brandEmbed({
                title: `👤 ${user.tag}`,
                thumbnail: false,
                fields: [
                    { name: "🆔 ID", value: user.id },
                    { name: "📅 Account Created", value: `<t:${Math.floor(user.createdTimestamp / 1000)}:D>` },
                    { name: "📥 Joined Server", value: member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>` : "Unknown" },
                    { name: "🎭 Roles", value: member ? `${member.roles.cache.size - 1}` : "Unknown" }
                ]
            });
            embed.setThumbnail(user.displayAvatarURL());

            await interaction.reply({ embeds: [embed] });
        }
    },

    // -- Avatar -------------------------------------------------------------
    {
        data: new SlashCommandBuilder()
            .setName("avatar")
            .setDescription("Get a member's avatar")
            .addUserOption(o => o.setName("user").setDescription("Whose avatar").setRequired(false)),

        async execute(interaction){
            const user = interaction.options.getUser("user") || interaction.user;
            const embed = brandEmbed({
                title: `🖼️ ${user.tag}'s Avatar`,
                thumbnail: false
            });
            embed.setImage(user.displayAvatarURL({ size: 512 }));
            await interaction.reply({ embeds: [embed] });
        }
    },

    // -- Suggestions ----------------------------------------------------------
    {
        data: new SlashCommandBuilder()
            .setName("suggest")
            .setDescription("Submit a suggestion for the server")
            .addStringOption(o => o.setName("idea").setDescription("Your suggestion").setRequired(true)),

        async execute(interaction){
            const idea = interaction.options.getString("idea");

            const embed = brandEmbed({
                title: "💡 New Suggestion",
                description: idea,
                thumbnail: false
            }).setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() });

            await interaction.reply({ embeds: [embed] });
            const msg = await interaction.fetchReply();
            await msg.react("👍").catch(() => {});
            await msg.react("👎").catch(() => {});
        }
    },

    // -- Ticket stats (staff) -----------------------------------------------
    {
        data: new SlashCommandBuilder()
            .setName("ticketstats")
            .setDescription("Staff: view ticket activity")
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

        async execute(interaction){
            if(!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)){
                return interaction.reply({ content: "❌ No permission.", ephemeral: true });
            }

            const log = ticketLogDB.read();
            const stillOpen = log.open.filter(t =>
                interaction.guild.channels.cache.has(t.channelId)
            );

            const byService = {};
            for(const t of log.open){
                byService[t.service] = (byService[t.service] || 0) + 1;
            }

            const breakdown = Object.entries(byService)
                .map(([service, count]) => `**${service}:** ${count}`)
                .join("\n") || "No tickets yet.";

            const embed = brandEmbed({
                title: "🎫 Ticket Stats",
                fields: [
                    { name: "📬 Currently Open", value: `${stillOpen.length}` },
                    { name: "📈 All-Time Total", value: `${log.open.length}` },
                    { name: "By Service", value: breakdown }
                ]
            });

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },

    // -- Bulk delete messages (staff) ---------------------------------------
    {
        data: new SlashCommandBuilder()
            .setName("clear")
            .setDescription("Staff: bulk delete messages in this channel")
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
            .addIntegerOption(o => o.setName("amount").setDescription("How many messages (1-100)").setRequired(true)),

        async execute(interaction){
            if(!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)){
                return interaction.reply({ content: "❌ No permission.", ephemeral: true });
            }
            const amount = Math.min(100, Math.max(1, interaction.options.getInteger("amount")));

            await interaction.deferReply({ ephemeral: true });
            const deleted = await interaction.channel.bulkDelete(amount, true).catch(err => {
                console.log(`[clear] ${err.message}`);
                return null;
            });

            await interaction.editReply({
                content: deleted
                    ? `🧹 Deleted ${deleted.size} messages (Discord only allows bulk-deleting messages under 14 days old).`
                    : "❌ Couldn't delete messages - check the bot has Manage Messages here."
            });
        }
    },

    // -- Poll -----------------------------------------------------------------
    {
        data: new SlashCommandBuilder()
            .setName("poll")
            .setDescription("Start a quick yes/no poll")
            .addStringOption(o => o.setName("question").setDescription("The question").setRequired(true)),

        async execute(interaction){
            const question = interaction.options.getString("question");

            const embed = brandEmbed({
                title: "📊 Poll",
                description: question,
                thumbnail: false
            }).setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() });

            await interaction.reply({ embeds: [embed] });
            const msg = await interaction.fetchReply();
            await msg.react("✅").catch(() => {});
            await msg.react("❌").catch(() => {});
        }
    },

    // -- Personal reminder ---------------------------------------------------
    {
        data: new SlashCommandBuilder()
            .setName("remindme")
            .setDescription("Get pinged with a reminder later")
            .addIntegerOption(o => o.setName("minutes").setDescription("How many minutes from now").setRequired(true))
            .addStringOption(o => o.setName("about").setDescription("What to remind you about").setRequired(true)),

        async execute(interaction){
            const minutes = interaction.options.getInteger("minutes");
            const about = interaction.options.getString("about");

            await interaction.reply({
                content: `⏰ Got it — I'll remind you about **${about}** in ${minutes} minute(s).`,
                ephemeral: true
            });

            setTimeout(() => {
                interaction.followUp({
                    content: `⏰ ${interaction.user} reminder: **${about}**`
                }).catch(() => {});
            }, minutes * 60000);
        }
    },

    // -- Magic 8-ball -----------------------------------------------------

    // -- Coinflip -------------------------------------------------------------

    // -- Provider balance check (staff) --------------------------------------
    {
        data: new SlashCommandBuilder()
            .setName("balance")
            .setDescription("Staff: check 5sim/SMSPool account balances")
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

        async execute(interaction){
            if(!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)){
                return interaction.reply({ content: "❌ No permission.", ephemeral: true });
            }

            await interaction.deferReply({ ephemeral: true });

            let fivesimBalance = "❌ not configured";
            let smspoolBalance = "❌ not configured";

            if(process.env.FIVESIM_API_KEY){
                try{
                    const res = await fetch("https://5sim.net/v1/user/profile", {
                        headers: { Authorization: `Bearer ${process.env.FIVESIM_API_KEY}` }
                    });
                    const data = await res.json();
                    fivesimBalance = res.ok ? `$${data.balance}` : `❌ ${data.message || "error"}`;
                }catch(err){
                    fivesimBalance = `❌ ${err.message}`;
                }
            }

            if(process.env.SMSPOOL_API_KEY){
                try{
                    const params = new URLSearchParams({ key: process.env.SMSPOOL_API_KEY });
                    const res = await fetch("https://api.smspool.net/request/balance", { method: "POST", body: params });
                    const data = await res.json();
                    smspoolBalance = data.balance !== undefined ? `$${data.balance}` : `❌ ${data.message || "error"}`;
                }catch(err){
                    smspoolBalance = `❌ ${err.message}`;
                }
            }

            const embed = brandEmbed({
                title: "💰 Provider Balances",
                fields: [
                    { name: "5sim", value: fivesimBalance },
                    { name: "SMSPool", value: smspoolBalance }
                ]
            });

            await interaction.editReply({ embeds: [embed] });
        }
    },

    // -- Staff announcement ---------------------------------------------------

    // -- COD: Random loadout generator ---------------------------------------

    // -- COD: Random map picker -----------------------------------------------

    // -- COD: Gulag simulator ---------------------------------------------

    // -- COD: Random camo challenge -------------------------------------------

    // -- Channel lock/unlock/slowmode (staff) --------------------------------
    {
        data: new SlashCommandBuilder()
            .setName("lock")
            .setDescription("Staff: lock this channel so @everyone can't send messages")
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

        async execute(interaction){
            if(!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)){
                return interaction.reply({ content: "❌ No permission.", ephemeral: true });
            }
            await interaction.channel.permissionOverwrites.edit(interaction.guild.id, { SendMessages: false }).catch(err => {
                return interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
            });
            await interaction.reply({ content: "🔒 Channel locked." });
        }
    },
    {
        data: new SlashCommandBuilder()
            .setName("unlock")
            .setDescription("Staff: unlock this channel")
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

        async execute(interaction){
            if(!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)){
                return interaction.reply({ content: "❌ No permission.", ephemeral: true });
            }
            await interaction.channel.permissionOverwrites.edit(interaction.guild.id, { SendMessages: null }).catch(err => {
                return interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
            });
            await interaction.reply({ content: "🔓 Channel unlocked." });
        }
    },
    {
        data: new SlashCommandBuilder()
            .setName("slowmode")
            .setDescription("Staff: set slowmode for this channel")
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
            .addIntegerOption(o => o.setName("seconds").setDescription("0 to disable").setRequired(true)),

        async execute(interaction){
            if(!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)){
                return interaction.reply({ content: "❌ No permission.", ephemeral: true });
            }
            const seconds = Math.max(0, Math.min(21600, interaction.options.getInteger("seconds")));
            await interaction.channel.setRateLimitPerUser(seconds).catch(err => {
                return interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
            });
            await interaction.reply({ content: seconds ? `🐌 Slowmode set to ${seconds}s.` : "✅ Slowmode disabled." });
        }
    },

    // -- Nickname (staff) -----------------------------------------------------
    {
        data: new SlashCommandBuilder()
            .setName("nickname")
            .setDescription("Staff: change a member's nickname")
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames)
            .addUserOption(o => o.setName("user").setDescription("Who to rename").setRequired(true))
            .addStringOption(o => o.setName("nickname").setDescription("New nickname (leave blank to reset)").setRequired(false)),

        async execute(interaction){
            if(!interaction.member.permissions.has(PermissionFlagsBits.ManageNicknames)){
                return interaction.reply({ content: "❌ No permission.", ephemeral: true });
            }
            const user = interaction.options.getUser("user");
            const nickname = interaction.options.getString("nickname") || null;
            const member = await interaction.guild.members.fetch(user.id).catch(() => null);
            if(!member) return interaction.reply({ content: "❌ User not found.", ephemeral: true });

            await member.setNickname(nickname).catch(err => {
                return interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
            });
            await interaction.reply({ content: `✅ Updated ${user}'s nickname.`, ephemeral: true });
        }
    },

    // -- Uptime -----------------------------------------------------------
    {
        data: new SlashCommandBuilder()
            .setName("uptime")
            .setDescription("See how long the bot has been running"),

        async execute(interaction){
            const totalSeconds = Math.floor(process.uptime());
            const h = Math.floor(totalSeconds / 3600);
            const m = Math.floor((totalSeconds % 3600) / 60);
            const s = totalSeconds % 60;
            await interaction.reply({ content: `⏱️ Uptime: **${h}h ${m}m ${s}s**` });
        }
    },

    // -- Timestamp converter --------------------------------------------------
    {
        data: new SlashCommandBuilder()
            .setName("timestamp")
            .setDescription("Convert minutes-from-now into a Discord dynamic timestamp")
            .addIntegerOption(o => o.setName("minutes").setDescription("Minutes from now").setRequired(true)),

        async execute(interaction){
            const minutes = interaction.options.getInteger("minutes");
            const ts = Math.floor((Date.now() + minutes * 60000) / 1000);
            await interaction.reply({
                content: `🕐 <t:${ts}:F> (<t:${ts}:R>)\nRaw: \`<t:${ts}:F>\``,
                ephemeral: true
            });
        }
    },

    // -- Invite link ------------------------------------------------------
    {
        data: new SlashCommandBuilder()
            .setName("invite")
            .setDescription("Get an invite link for this bot"),

        async execute(interaction){
            const url = `https://discord.com/api/oauth2/authorize?client_id=${process.env.CLIENT_ID}&permissions=8&scope=bot%20applications.commands`;
            await interaction.reply({ content: `🔗 [Click here to invite me to another server](${url})`, ephemeral: true });
        }
    },

    // -- Champion's Quest (Nuke) pricing panel -------------------------------
    {
        data: new SlashCommandBuilder()
            .setName("championsquest")
            .setDescription("Post the Nuke / Champion's Quest pricing panel")
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

        async execute(interaction){

            const emojis = await fetchGuildEmojis(interaction.guild);
            const nukeEmoji = emojiTag(emojis, "1528171131700248676", "☢️");
            const nukeGuildEmoji = emojis?.get("1528171131700248676");

            const embed = brandEmbed({
                title: "Rewards",
                fields: [
                    { name: "Rewards", value:
                        `${nukeEmoji} Special Nuke Animated Calling Card\n` +
                        `${nukeEmoji} Special Nuke Spray\n` +
                        `${nukeEmoji} Special Nuke Animated Weapon Camo(s)\n` +
                        `${nukeEmoji} Special Nuke Weapon Blueprint\n` +
                        `${nukeEmoji} Unique NUKE OPERATOR Skin`
                    },
                    { name: "Nuke[s] Price [Manual Pilot Via Battlenet]", value:
                        "1x Nuke | $79.99\n5x Nuke | $199.99\n10x Nuke | $399.99"
                    }
                ],
                thumbnail: false
            });

            const button = new ButtonBuilder()
                .setCustomId("buy_nuke")
                .setLabel("Purchase Nuke")
                .setStyle(ButtonStyle.Danger);

            // Only attach the emoji to the button if the bot can actually
            // resolve it - an unresolvable emoji object on a button throws
            // and would take down the whole command.
            if(nukeGuildEmoji){
                button.setEmoji({ id: nukeGuildEmoji.id, animated: nukeGuildEmoji.animated });
            }

            await interaction.reply({
                embeds: [embed],
                components: [new ActionRowBuilder().addComponents(button)]
            });

        }
    },

    // -- Ranked Play pricing panel --------------------------------------------
    {
        data: new SlashCommandBuilder()
            .setName("rankboost")
            .setDescription("Post the Warzone Ranked Play pricing panel")
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

        async execute(interaction){

            const emojis = await fetchGuildEmojis(interaction.guild);

            const ranks = {
                bronze: emojiTag(emojis, "1528349678318387290", "Bronze"),
                silver: emojiTag(emojis, "1528349825119027250", "Silver"),
                gold: emojiTag(emojis, "1528349951774556213", "Gold"),
                platinum: emojiTag(emojis, "1528350059647860839", "Platinum"),
                diamond: emojiTag(emojis, "1528350158960595014", "Diamond"),
                crimson: emojiTag(emojis, "1528350253886078996", "Crimson"),
                iridescent: emojiTag(emojis, "1528350360245375008", "Iridescent"),
                top250: emojiTag(emojis, "1528350484761546813", "⭐")
            };
            const arrow = emojiTag(emojis, "1528350607021310054", "→");

            const embed = brandEmbed({
                title: "Warzone Ranked Play Prices",
                fields: [
                    { name: "Pricing", value:
                        `${ranks.bronze} ${arrow} ${ranks.silver} | $10\n` +
                        `${ranks.silver} ${arrow} ${ranks.gold} | $30\n` +
                        `${ranks.gold} ${arrow} ${ranks.platinum} | $50\n` +
                        `${ranks.platinum} ${arrow} ${ranks.diamond} | $65\n` +
                        `${ranks.diamond} ${arrow} ${ranks.crimson} | $90\n` +
                        `${ranks.crimson} ${arrow} ${ranks.iridescent} | $145\n` +
                        `${ranks.top250} TOP 250 (Ask for details)\n` +
                        `${ranks.bronze} ${arrow} ${ranks.iridescent} | $250`
                    }
                ],
                thumbnail: false
            });

            const button = new ButtonBuilder()
                .setCustomId("buy_rankboost")
                .setLabel("Ranked Boost")
                .setEmoji("🎖️")
                .setStyle(ButtonStyle.Danger);

            await interaction.reply({
                embeds: [embed],
                components: [new ActionRowBuilder().addComponents(button)]
            });

        }
    },

    // -- Camo Mastery Paths pricing panel ------------------------------------
    {
        data: new SlashCommandBuilder()
            .setName("camo")
            .setDescription("Post the Camo Mastery pricing panel")
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

        async execute(interaction){

            const embed = brandEmbed({
                title: "🎯 Camo Mastery Paths",
                description: "Pick your game mode below and let us grind the mastery camo path for you.",
                fields: [
                    { name: "🎯 Multiplayer (MP)", value:
                        "1️⃣ 🟨 Shattered Gold — $30\n" +
                        "2️⃣ 🌌 Arclight — $50\n" +
                        "3️⃣ ⚡ Tempest — $75\n" +
                        "4️⃣ 🌌 **Singularity** — $100"
                    },
                    { name: "🧟 Zombies (ZM)", value:
                        "1️⃣ 🐉 Golden Dragon — $45\n" +
                        "2️⃣ 💎 Bloodstone — $75\n" +
                        "3️⃣ ⚙️ Doomsteel — $110\n" +
                        "4️⃣ 👾 **Infestation** — $150"
                    },
                    { name: "🪂 Warzone (WZ)", value:
                        "1️⃣ 🟡 Golden Damascus — $30\n" +
                        "2️⃣ ✨ Starglass — $50\n" +
                        "3️⃣ ❄️ Absolute Zero — $75\n" +
                        "4️⃣ ☢️ **Apocalypse** — $100"
                    },
                    { name: "⚔️ Endgame", value:
                        "1️⃣ 🌙 Moonstone — $30\n" +
                        "2️⃣ 🌈 Chroma Flux — $50\n" +
                        "3️⃣ 🟢 **Genesis** — $100"
                    }
                ],
                thumbnail: false
            });

            const button = new ButtonBuilder()
                .setCustomId("buy_camo")
                .setLabel("Purchase Camo")
                .setEmoji("🎨")
                .setStyle(ButtonStyle.Danger);

            await interaction.reply({
                embeds: [embed],
                components: [new ActionRowBuilder().addComponents(button), websiteRow()].filter(Boolean)
            });

        }
    },

    // -- Endgame Operators pricing panel --------------------------------------
    {
        data: new SlashCommandBuilder()
            .setName("endgame")
            .setDescription("Post the Endgame Operators pricing panel")
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

        async execute(interaction){

            const emojis = await fetchGuildEmojis(interaction.guild);
            const panelEmoji = emojiTag(emojis, "1530322984026243275", "⚡");
            const arrow = emojiTag(emojis, "1528350607021310054", "»");
            const panelGuildEmoji = emojis?.get("1530322984026243275");

            const embed = brandEmbed({
                title: `${panelEmoji} Endgame Skins`,
                fields: [
                    { name: "No Fear Operators", value:
                        `${arrow} No Fear operators | $10/E\n` +
                        `${arrow} All No Fear operators | $100`
                    },
                    { name: "Glitch Operators", value:
                        `${arrow} Glitch Operators | $15/E\n` +
                        `${arrow} All Glitch Operators | $150`
                    }
                ],
                thumbnail: false
            });

            const button = new ButtonBuilder()
                .setCustomId("buy_endgame")
                .setLabel("EndGame Operators")
                .setStyle(ButtonStyle.Danger);

            if(panelGuildEmoji){
                button.setEmoji({ id: panelGuildEmoji.id, animated: panelGuildEmoji.animated });
            }

            await interaction.reply({
                embeds: [embed],
                components: [new ActionRowBuilder().addComponents(button), websiteRow()].filter(Boolean)
            });

        }
    },

    // -- Rank Calculator (replicates the website calculator) ------------------
    {
        data: new SlashCommandBuilder()
            .setName("rankcalc")
            .setDescription("Calculate the price and time for a rank boost"),

        async execute(interaction){
            const emojis = await fetchGuildEmojis(interaction.guild);
            const arrow = emojiTag(emojis, RANK_ARROW_EMOJI_ID, "→");

            await interaction.reply({
                embeds: [buildRankResultEmbed(arrow, null, null)],
                components: buildRankComponents(emojis, null, null),
                ephemeral: true
            });
        }
    },

    // -- AI Support: /ask ---------------------------------------------------
    {
        data: new SlashCommandBuilder()
            .setName("ask")
            .setDescription("Ask the 24/7 AI support assistant a question")
            .addStringOption(o => o.setName("question").setDescription("Your question").setRequired(true)),

        async execute(interaction){
            const question = interaction.options.getString("question");
            await interaction.deferReply();

            const answer = await askAI(question);

            const embed = brandEmbed({
                title: `🤖 ${CONFIG.AI_NAME}`,
                fields: [
                    { name: "❓ Question", value: question },
                    { name: "💬 Answer", value: answer }
                ]
            });

            await interaction.editReply({ embeds: [embed] });
        }
    },

    // -- AI Support: /support (mirrors the website widget) -------------------
    {
        data: new SlashCommandBuilder()
            .setName("support")
            .setDescription("Open the 24/7 support panel"),

        async execute(interaction){

            const logoPath = path.join(__dirname, "logo.png");
            const hasLogo = fs.existsSync(logoPath);

            const embed = new EmbedBuilder()
                .setColor("#9B30FF")
                .setAuthor(hasLogo ? { name: `${CONFIG.BRAND_NAME} Support`, iconURL: "attachment://logo.png" } : { name: `${CONFIG.BRAND_NAME} Support` })
                .setTitle("🛟 24/7 Support — We've Got You")
                .setDescription(
                    "```\n⚡ INSTANT HELP CENTER ⚡\n```\n" +
                    `Pick a quick question below for an instant answer, or use \`/ask\` anytime to talk to **${CONFIG.AI_NAME}** directly.\n\n` +
                    "🎫 For orders or account-specific issues, open a ticket instead — a real human will jump in.\n\n" +
                    "▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬"
                )
                .setFooter({ text: `${CONFIG.BRAND_NAME} • Always here for you` })
                .setTimestamp();

            if(hasLogo){
                embed.setThumbnail("attachment://logo.png");
                embed.setImage("attachment://logo.png");
            }else{
                console.log("[support] ⚠️ logo.png not found in the bot's root folder - posting without the logo. Make sure logo.png was uploaded alongside bot.js and commands.js.");
            }

            const row1 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("ai_q_ranked").setLabel("How does rank boosting work?").setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId("ai_q_sms").setLabel("What if my SMS code doesn't work?").setStyle(ButtonStyle.Secondary)
            );
            const row2 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("ai_q_camo").setLabel("How much for a Gold camo?").setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId("ai_q_safe").setLabel("Is my account safe?").setStyle(ButtonStyle.Secondary)
            );

            await interaction.reply({
                embeds: [embed],
                files: hasLogo ? [{ attachment: logoPath, name: "logo.png" }] : [],
                components: [row1, row2, websiteRow()].filter(Boolean)
            });
        }
    },

    // -- Order status (customer) ---------------------------------------------
    {
        data: new SlashCommandBuilder()
            .setName("orderstatus")
            .setDescription("Check the status of your most recent order"),

        async execute(interaction){
            const log = ticketLogDB.read();
            const myTickets = log.open
                .filter(t => t.user === interaction.user.id)
                .sort((a, b) => new Date(b.created) - new Date(a.created));

            if(!myTickets.length){
                return interaction.reply({ content: "You don't have any orders on record yet. Open a ticket to get started!", ephemeral: true });
            }

            const latest = myTickets[0];
            const statusEmoji = { pending: "🟡", in_progress: "🔵", completed: "🟢" };
            const statusLabel = { pending: "Pending - awaiting staff", in_progress: "In Progress", completed: "Completed" };
            const stageLabel = { started: "🟡 Started", halfway: "🟠 Halfway Done", completed: "✅ Complete" };

            const embed = brandEmbed({
                title: "📦 Your Order Status",
                fields: [
                    { name: "Service", value: latest.service },
                    { name: "Status", value: `${statusEmoji[latest.status] || "⚪"} ${statusLabel[latest.status] || latest.status}` },
                    ...(latest.orderStage ? [{ name: "Progress", value: stageLabel[latest.orderStage] || latest.orderStage }] : []),
                    { name: "Opened", value: `<t:${Math.floor(new Date(latest.created).getTime() / 1000)}:R>` },
                    ...(latest.claimedBy ? [{ name: "Handled by", value: `<@${latest.claimedBy}>` }] : [])
                ]
            });

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },

    // -- Staff performance stats ---------------------------------------------
    {
        data: new SlashCommandBuilder()
            .setName("staffstats")
            .setDescription("Staff: see who's closing the most orders")
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

        async execute(interaction){
            if(!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)){
                return interaction.reply({ content: "❌ No permission.", ephemeral: true });
            }

            const log = ticketLogDB.read();
            const counts = {};

            for(const t of log.open){
                if(t.closedBy){
                    counts[t.closedBy] = counts[t.closedBy] || { claimed: 0, closed: 0 };
                    counts[t.closedBy].closed++;
                }
                if(t.claimedBy){
                    counts[t.claimedBy] = counts[t.claimedBy] || { claimed: 0, closed: 0 };
                    counts[t.claimedBy].claimed++;
                }
            }

            const sorted = Object.entries(counts).sort((a, b) => b[1].closed - a[1].closed);

            const lines = sorted.length
                ? sorted.map(([id, s], i) => `**${i + 1}.** <@${id}> — ${s.closed} closed, ${s.claimed} claimed`).join("\n")
                : "No ticket activity yet.";

            const embed = brandEmbed({
                title: "📈 Staff Performance",
                description: lines
            });

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },

    // -- Booster application --------------------------------------------------
    {
        data: new SlashCommandBuilder()
            .setName("apply")
            .setDescription("Apply to become a booster for this server"),

        async execute(interaction){
            const modal = new ModalBuilder()
                .setCustomId("apply_form")
                .setTitle("Booster Application");

            const experience = new TextInputBuilder()
                .setCustomId("apply_experience")
                .setLabel("Your rank/experience (Warzone & MP)")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const availability = new TextInputBuilder()
                .setCustomId("apply_availability")
                .setLabel("Weekly availability (hours/days)")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const why = new TextInputBuilder()
                .setCustomId("apply_why")
                .setLabel("Why do you want to boost for us?")
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(experience),
                new ActionRowBuilder().addComponents(availability),
                new ActionRowBuilder().addComponents(why)
            );

            await interaction.showModal(modal);
        }
    },

    // -- FAQ ------------------------------------------------------------------
    {
        data: new SlashCommandBuilder()
            .setName("faq")
            .setDescription("Browse frequently asked questions"),

        async execute(interaction){
            const embed = brandEmbed({
                title: "❓ Frequently Asked Questions",
                description: "Pick a topic below for an instant answer."
            });

            const menu = new StringSelectMenuBuilder()
                .setCustomId("faq_select")
                .setPlaceholder("Choose a topic...")
                .addOptions(FAQ_CATALOG.map(f => ({ label: f.question, value: f.value, emoji: f.emoji })));

            await interaction.reply({
                embeds: [embed],
                components: [new ActionRowBuilder().addComponents(menu)],
                ephemeral: true
            });
        }
    },

    // -- Instant FAQ search with autocomplete ----------------------------------
    {
        data: new SlashCommandBuilder()
            .setName("faqsearch")
            .setDescription("Search FAQs instantly with autocomplete")
            .addStringOption(o => o.setName("question").setDescription("Start typing your question").setRequired(true).setAutocomplete(true)),

        async autocomplete(interaction){
            const focused = interaction.options.getFocused().toLowerCase();
            const matches = FAQ_CATALOG.filter(f => f.question.toLowerCase().includes(focused)).slice(0, 25);
            await interaction.respond(matches.map(f => ({ name: f.question, value: f.value })));
        },

        async execute(interaction){
            const value = interaction.options.getString("question");
            const faq = FAQ_CATALOG.find(f => f.value === value);

            if(!faq){
                return interaction.reply({ content: "❌ Couldn't find that question - pick one from the autocomplete list.", ephemeral: true });
            }

            const embed = brandEmbed({
                title: `${faq.emoji} ${faq.question}`,
                description: faq.answer
            });

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },

    // -- Referral program -----------------------------------------------------
    {
        data: new SlashCommandBuilder()
            .setName("referral")
            .setDescription("Get your referral code and see how many people you've referred"),

        async execute(interaction){
            const referrals = referralsDB.read();
            let myCode = Object.keys(referrals).find(code => referrals[code].owner === interaction.user.id);

            if(!myCode){
                myCode = `${interaction.user.username.slice(0, 6).toUpperCase()}${Math.floor(Math.random() * 900 + 100)}`;
                referrals[myCode] = { owner: interaction.user.id, uses: [] };
                referralsDB.write(referrals);
            }

            const uses = referrals[myCode].uses.length;

            const embed = brandEmbed({
                title: "🎁 Your Referral Code",
                fields: [
                    { name: "Code", value: `\`${myCode}\`` },
                    { name: "Times used", value: `${uses}` },
                    { name: "How it works", value: "Have friends mention your code when opening a ticket - staff can apply referral perks manually." }
                ]
            });

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },

    // -- Price calculator (mirrors the website's Calculator page) -------------

    // -- Flash sale announcer (staff) -----------------------------------------
    {
        data: new SlashCommandBuilder()
            .setName("sale")
            .setDescription("Staff: announce a flash sale with a countdown")
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
            .addStringOption(o => o.setName("discount").setDescription("e.g. 20% off everything").setRequired(true))
            .addIntegerOption(o => o.setName("hours").setDescription("Sale duration in hours").setRequired(true)),

        async execute(interaction){
            if(!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)){
                return interaction.reply({ content: "❌ No permission.", ephemeral: true });
            }

            const discount = interaction.options.getString("discount");
            const hours = interaction.options.getInteger("hours");
            const endTime = Math.floor((Date.now() + hours * 3600000) / 1000);

            const embed = brandEmbed({
                title: "🔥 FLASH SALE 🔥",
                color: "#FF4500",
                description: `# ${discount}\n\nEnds <t:${endTime}:R> (<t:${endTime}:F>)\n\nOpen a ticket now to lock in this price before it's gone!`
            });

            await interaction.reply({ content: "@here", embeds: [embed], components: [websiteRow()].filter(Boolean) });
        }
    },

    // -- Custom embed poster (/post) ------------------------------------------
    {
        data: new SlashCommandBuilder()
            .setName("post")
            .setDescription("Staff: create a professional formatted embed post")
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

        async execute(interaction){

            if(!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)){
                return interaction.reply({ content: "❌ No permission.", ephemeral: true });
            }

            const modal = new ModalBuilder()
                .setCustomId("post_form")
                .setTitle("Create Embed Post");

            const titleInput = new TextInputBuilder()
                .setCustomId("post_title")
                .setLabel("Title")
                .setStyle(TextInputStyle.Short)
                .setMaxLength(256)
                .setRequired(true);

            const descriptionInput = new TextInputBuilder()
                .setCustomId("post_description")
                .setLabel("Description")
                .setStyle(TextInputStyle.Paragraph)
                .setMaxLength(3500)
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(titleInput),
                new ActionRowBuilder().addComponents(descriptionInput)
            );

            await interaction.showModal(modal);

        }
    },

    // -- Server setup (the big one) ------------------------------------------
    {
        data: new SlashCommandBuilder()
            .setName("setup")
            .setDescription("Staff: create all the standard Weekendthriller Services categories & channels")
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

        async execute(interaction){

            if(!interaction.member.permissions.has(PermissionFlagsBits.Administrator)){
                return interaction.reply({ content: "❌ You need Administrator to run this.", ephemeral: true });
            }

            await interaction.deferReply({ ephemeral: true });

            const guild = interaction.guild;
            const created = { categories: 0, text: 0, voice: 0 };
            const results = { vouchChannelId: null, leaveVouchChannelId: null, ticketPanelChannelId: null };
            const newlyCreated = { ticketsChannel: null, leaveVouchChannel: null };

            // Structure to build: [categoryName, [ [channelName, type], ... ] ]
            const structure = [
                [
                    "『SERVER』",
                    [
                        ["announcements", "text"],
                        ["air-port", "text"],
                        ["air-port-2", "text"],
                        ["giveaways", "text"],
                        ["website", "text"],
                        ["payment-methods", "text"]
                    ]
                ],
                [
                    "Weekendthriller Lounge",
                    [
                        ["chat", "text"],
                        ["wz-lfg", "text"],
                        ["mp-lfg", "text"]
                    ]
                ],
                [
                    "Weekendthriller Services",
                    [
                        ["accounts", "text"],
                        ["champions-quest", "text"],
                        ["wz-ranked-boost", "text"],
                        ["mp-ranked-boost", "text"],
                        ["wz-ranked-ready", "text"],
                        ["vouches", "text"],
                        ["leave-a-vouch", "text"],
                        ["tickets", "text"]
                    ]
                ],
                [
                    "Weekendthriller Voice Channels",
                    [
                        ["commands", "text"],
                        ["Lounge", "voice"]
                    ]
                ]
            ];

            try{

                for(const [categoryName, channels] of structure){

                    // Reuse an existing category with the same name instead of
                    // making a duplicate if you run /setup more than once.
                    let category = guild.channels.cache.find(
                        c => c.type === ChannelType.GuildCategory && c.name === categoryName
                    );

                    if(!category){
                        category = await guild.channels.create({
                            name: categoryName,
                            type: ChannelType.GuildCategory
                        });
                        created.categories++;
                    }

                    for(const [channelName, kind] of channels){

                        const exists = guild.channels.cache.find(
                            c => c.name === channelName && c.parentId === category.id
                        );
                        if(exists){
                            if(channelName === "vouches") results.vouchChannelId = exists.id;
                            if(channelName === "leave-a-vouch") results.leaveVouchChannelId = exists.id;
                            if(channelName === "tickets") results.ticketPanelChannelId = exists.id;
                            continue;
                        }

                        const channel = await guild.channels.create({
                            name: channelName,
                            type: kind === "voice" ? ChannelType.GuildVoice : ChannelType.GuildText,
                            parent: category.id
                        });

                        if(kind === "voice") created.voice++; else created.text++;

                        if(channelName === "vouches") results.vouchChannelId = channel.id;
                        if(channelName === "leave-a-vouch"){
                            results.leaveVouchChannelId = channel.id;
                            newlyCreated.leaveVouchChannel = channel;
                        }
                        if(channelName === "tickets"){
                            results.ticketPanelChannelId = channel.id;
                            newlyCreated.ticketsChannel = channel;
                        }

                    }

                }

            }catch(err){
                console.log(`[setup] ❌ ${err.message}`);
                return interaction.editReply({
                    content: `❌ Setup failed partway through (\`${err.message}\`). This is almost always missing **Manage Channels** on the bot's role. Check the permissions and run \`/setup\` again - it skips anything already created.`
                });
            }

            const needsEnvUpdate =
                results.vouchChannelId !== CONFIG.VOUCH_CHANNEL_ID ||
                results.leaveVouchChannelId !== CONFIG.LEAVE_VOUCH_CHANNEL_ID;

            // Auto-post the ticket panel in the new #tickets channel
            if(newlyCreated.ticketsChannel){
                const ticketEmbed = brandEmbed({
                    title: "Choose Your Service",
                    description: "Select an option below and a private ticket will be created just for you.",
                    fields: [{
                        name: "How it works",
                        value: "1️⃣ Pick a service from the dropdown\n2️⃣ A private channel opens for you\n3️⃣ Staff will claim & assist you there"
                    }]
                });
                const ticketMenu = new StringSelectMenuBuilder()
                    .setCustomId("ticket_select")
                    .setPlaceholder("Services")
                    .addOptions(CONFIG.TICKET_SERVICES.map(s => ({ label: s.label, value: s.value, emoji: s.emoji })));

                await newlyCreated.ticketsChannel.send({
                    embeds: [ticketEmbed],
                    components: [new ActionRowBuilder().addComponents(ticketMenu), websiteRow()].filter(Boolean)
                }).catch(err => console.log(`[setup] could not post ticket panel: ${err.message}`));
            }

            // Auto-post the "Leave a Vouch" panel in the new #leave-a-vouch channel
            if(newlyCreated.leaveVouchChannel){
                const vouchButton = new ButtonBuilder()
                    .setCustomId("leave_vouch")
                    .setLabel("📝 Leave a Vouch")
                    .setEmoji("⭐")
                    .setStyle(ButtonStyle.Danger);

                await newlyCreated.leaveVouchChannel.send({
                    embeds: [buildVouchPanelEmbed()],
                    components: [new ActionRowBuilder().addComponents(vouchButton), websiteRow()].filter(Boolean)
                }).catch(err => console.log(`[setup] could not post vouch panel: ${err.message}`));
            }

            const embed = brandEmbed({
                title: "✅ Server Setup Complete",
                fields: [
                    { name: "📁 Categories created", value: `${created.categories}` },
                    { name: "💬 Text channels created", value: `${created.text}` },
                    { name: "🔊 Voice channels created", value: `${created.voice}` },
                    { name: "⭐ Vouches channel", value: `<#${results.vouchChannelId}>` },
                    { name: "📝 Leave-a-vouch channel", value: `<#${results.leaveVouchChannelId}>` },
                    { name: "🎫 Tickets channel", value: `<#${results.ticketPanelChannelId}>` }
                ],
                description: needsEnvUpdate
                    ? "⚠️ These channel IDs don't match your current `VOUCH_CHANNEL_ID` / `LEAVE_VOUCH_CHANNEL_ID` env vars - update them in Railway to the IDs above so the vouch system posts in the right place."
                    : "Everything matches your current config - no env var changes needed."
            });

            await interaction.editReply({ embeds: [embed] });

        }
    },

    // -- List every emoji the bot can actually see (the definitive check) ---

    // -- Ping / latency check ------------------------------------------------
    // -- Master price list, ties the whole shop together ----------------------
    {
        data: new SlashCommandBuilder()
            .setName("pricing")
            .setDescription("View all services and their price commands in one place"),
        async execute(interaction){
            const embed = brandEmbed({
                title: `💰 ${CONFIG.BRAND_NAME} — Full Price Menu`,
                fields: [
                    { name: "☢️ Nuke Services", value: "Use `/championsquest` for pricing" },
                    { name: "⚔️ Rank Boosting", value: "Use `/rankboost` or `/rankcalc` for an instant quote" },
                    { name: "🎨 Camo Grinding", value: "Use `/camo` for all 4 game modes" },
                    { name: "⚡ Endgame Operators", value: "Use `/endgame` for skin pricing" },
                    { name: "📱 Number Rental", value: "Use `/getnumber` or `/gen` to buy instantly" },
                    { name: "🤝 Middleman Service", value: `Use \`/middleman\` — ${CONFIG.MIDDLEMAN_FEE_PERCENT}% fee on cash trades` },
                    { name: "🎫 Anything else", value: "Open a ticket with `/ticketpanel` and staff will quote you" }
                ]
            });
            await interaction.reply({ embeds: [embed], components: [websiteRow()].filter(Boolean) });
        }
    },

    // -- Trust/warranty info ---------------------------------------------------
    {
        data: new SlashCommandBuilder()
            .setName("warranty")
            .setDescription("View our service guarantee"),
        async execute(interaction){
            const embed = brandEmbed({
                title: "🛡️ Our Warranty",
                description:
                    "We stand behind every order:\n\n" +
                    "✅ If a boost isn't delivered as described, we make it right - open a ticket\n" +
                    "✅ Number rentals auto-refund if no SMS code arrives in time\n" +
                    "✅ Account safety is taken seriously on every boosting order\n" +
                    "✅ Staff are reachable 24/7 via `/support` for anything urgent"
            });
            await interaction.reply({ embeds: [embed] });
        }
    },

    // -- Socials/content links --------------------------------------------------
    {
        data: new SlashCommandBuilder()
            .setName("socials")
            .setDescription("Links to our socials and content"),
        async execute(interaction){
            const embed = brandEmbed({
                title: `📲 Follow ${CONFIG.BRAND_NAME}`,
                description: "Check the **#youtube** and **#announcements** channels for the latest links and content drops."
            });
            await interaction.reply({ embeds: [embed], components: [websiteRow()].filter(Boolean) });
        }
    },

    // -- Random featured vouch (social proof) -----------------------------------
    {
        data: new SlashCommandBuilder()
            .setName("testimonial")
            .setDescription("See a random customer testimonial"),
        async execute(interaction){
            const stats = vouchesDB.read();
            if(!stats.entries.length){
                return interaction.reply({ content: "No vouches yet - be the first!", ephemeral: true });
            }
            const pick = stats.entries[Math.floor(Math.random() * stats.entries.length)];
            const embed = brandEmbed({
                title: "⭐ Customer Testimonial",
                description: pick.comment || "*(no comment left)*",
                fields: pick.rating ? [{ name: "Rating", value: "⭐".repeat(pick.rating) }] : []
            });
            await interaction.reply({ embeds: [embed] });
        }
    },

    // -- Discount code system ---------------------------------------------------
    {
        data: new SlashCommandBuilder()
            .setName("discount")
            .setDescription("Staff: create a discount code")
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
            .addStringOption(o => o.setName("code").setDescription("The code customers will enter").setRequired(true))
            .addIntegerOption(o => o.setName("percent").setDescription("Percent off (1-100)").setRequired(true))
            .addIntegerOption(o => o.setName("uses").setDescription("How many times it can be used (default 1)").setRequired(false)),
        async execute(interaction){
            if(!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)){
                return interaction.reply({ content: "❌ No permission.", ephemeral: true });
            }
            const code = interaction.options.getString("code").toUpperCase();
            const percent = Math.min(100, Math.max(1, interaction.options.getInteger("percent")));
            const uses = interaction.options.getInteger("uses") || 1;

            const discounts = discountsDB.read();
            discounts[code] = { percent, usesLeft: uses, createdBy: interaction.user.id };
            discountsDB.write(discounts);

            await interaction.reply({ content: `✅ Created code \`${code}\` for **${percent}% off**, good for ${uses} use(s).`, ephemeral: true });
        }
    },
    {
        data: new SlashCommandBuilder()
            .setName("redeem")
            .setDescription("Redeem a discount code")
            .addStringOption(o => o.setName("code").setDescription("Your discount code").setRequired(true)),
        async execute(interaction){
            const code = interaction.options.getString("code").toUpperCase();
            const discounts = discountsDB.read();
            const entry = discounts[code];

            if(!entry || entry.usesLeft <= 0){
                return interaction.reply({ content: "❌ That code is invalid or already used up.", ephemeral: true });
            }

            entry.usesLeft--;
            discountsDB.write(discounts);

            await interaction.reply({
                content: `✅ Code redeemed! You get **${entry.percent}% off**. Mention this in your ticket and staff will apply it.`,
                ephemeral: true
            });
        }
    },

    // -- Live "how busy are we" indicator ---------------------------------------
    {
        data: new SlashCommandBuilder()
            .setName("eta")
            .setDescription("See current wait time based on open tickets"),
        async execute(interaction){
            const log = ticketLogDB.read();
            const openCount = log.open.filter(t =>
                interaction.guild.channels.cache.has(t.channelId)
            ).length;

            let estimate;
            if(openCount === 0) estimate = "🟢 We're wide open - orders start almost immediately!";
            else if(openCount <= 3) estimate = "🟡 Light queue - expect a quick response.";
            else if(openCount <= 7) estimate = "🟠 Moderate queue - some wait expected.";
            else estimate = "🔴 We're busy right now - thanks for your patience!";

            const embed = brandEmbed({
                title: "⏳ Current Wait Time",
                fields: [
                    { name: "Open Orders", value: `${openCount}` },
                    { name: "Estimate", value: estimate }
                ]
            });
            await interaction.reply({ embeds: [embed] });
        }
    },

    // -- Top customer recognition -------------------------------------------
    {
        data: new SlashCommandBuilder()
            .setName("topcustomer")
            .setDescription("See our #1 customer by vouch count"),
        async execute(interaction){
            const users = usersDB.read();
            const sorted = Object.entries(users).sort((a, b) => (b[1].vouches || 0) - (a[1].vouches || 0));

            if(!sorted.length){
                return interaction.reply({ content: "No customers on record yet.", ephemeral: true });
            }

            const [topId, topData] = sorted[0];
            const embed = brandEmbed({
                title: "👑 Top Customer",
                description: `<@${topId}> with **${topData.vouches}** vouches!`
            });
            await interaction.reply({ embeds: [embed] });
        }
    },

    // -- Personal vouch count check ----------------------------------------

    // -- Thank a server booster (Discord Nitro boost, not CoD boosting) -----
    {
        data: new SlashCommandBuilder()
            .setName("boosterthanks")
            .setDescription("Staff: publicly thank someone for boosting the server")
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
            .addUserOption(o => o.setName("user").setDescription("Who boosted").setRequired(true)),
        async execute(interaction){
            if(!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)){
                return interaction.reply({ content: "❌ No permission.", ephemeral: true });
            }
            const user = interaction.options.getUser("user");
            const embed = brandEmbed({
                title: "💎 Server Boost!",
                description: `Huge thanks to ${user} for boosting **${CONFIG.BRAND_NAME}**! 🚀`,
                color: "#f47fff"
            });
            await interaction.reply({ embeds: [embed] });
        }
    },

    // -- Account safety trust FAQ ---------------------------------------------
    {
        data: new SlashCommandBuilder()
            .setName("accountsafety")
            .setDescription("Learn how we keep your account safe during boosts"),
        async execute(interaction){
            const embed = brandEmbed({
                title: "🔒 Account Safety",
                description:
                    "Here's how we protect you during every order:\n\n" +
                    "🔸 We never ask for info outside an active, staff-claimed ticket\n" +
                    "🔸 Boosts are done carefully to minimize any unnecessary risk\n" +
                    "🔸 If anything feels off during an order, stop and tell staff immediately\n" +
                    "🔸 Check `/warranty` for what happens if something goes wrong"
            });
            await interaction.reply({ embeds: [embed] });
        }
    },

    {
        data: new SlashCommandBuilder()
            .setName("ping")
            .setDescription("Check if the bot is alive and how fast it's responding"),

        async execute(interaction){
            const sent = await interaction.reply({ content: "🏓 Pinging...", withResponse: true });
            const roundtrip = sent.resource?.message
                ? sent.resource.message.createdTimestamp - interaction.createdTimestamp
                : 0;
            await interaction.editReply(
                `🏓 Pong! Roundtrip: ${roundtrip}ms | WebSocket: ${interaction.client.ws.ping}ms`
            );
        }
    },

    // -- Auto-generated help/command list -------------------------------------
    {
        data: new SlashCommandBuilder()
            .setName("help")
            .setDescription("List everything this bot can do"),

        async execute(interaction){
            // Built from the same slashCommands array used to register commands,
            // so this can never drift out of sync with what's actually available.
            const lines = slashCommands
                .filter(c => c.data.name !== "help")
                .map(c => `**/${c.data.name}** — ${c.data.description}`)
                .join("\n");

            const embed = brandEmbed({
                title: `${CONFIG.BRAND_NAME} — Commands`,
                description: lines
            });

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },

    // -- Self-diagnostic status command (the "surprise") --------------------
    {
        data: new SlashCommandBuilder()
            .setName("status")
            .setDescription("Staff: check the bot's own health & config")
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

        async execute(interaction){

            if(!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)){
                return interaction.reply({ content: "❌ No permission.", ephemeral: true });
            }

            const checks = [];

            checks.push([`TOKEN`, !!process.env.TOKEN]);
            checks.push([`CLIENT_ID`, !!process.env.CLIENT_ID]);
            checks.push([`VOUCH_CHANNEL_ID`, !!CONFIG.VOUCH_CHANNEL_ID]);
            checks.push([`LEAVE_VOUCH_CHANNEL_ID`, !!CONFIG.LEAVE_VOUCH_CHANNEL_ID]);
            checks.push([`FIVESIM_API_KEY`, !!process.env.FIVESIM_API_KEY]);
            checks.push([`SMSPOOL_API_KEY`, !!process.env.SMSPOOL_API_KEY]);
            checks.push([`GEMINI_API_KEY`, !!process.env.GEMINI_API_KEY]);
            checks.push([`SECURITY_LOG_CHANNEL_ID`, !!CONFIG.SECURITY_LOG_CHANNEL_ID]);
            checks.push([`APPLICATION_CHANNEL_ID`, !!CONFIG.APPLICATION_CHANNEL_ID]);
            checks.push([`ANTI_NUKE_ENABLED`, CONFIG.ANTI_NUKE_ENABLED]);
            checks.push([`VERIFIED_ROLE_ID`, !!CONFIG.VERIFIED_ROLE_ID]);

            let vouchChannelOk = "N/A";
            if(CONFIG.VOUCH_CHANNEL_ID){
                const ch = await interaction.guild.channels.fetch(CONFIG.VOUCH_CHANNEL_ID).catch(() => null);
                vouchChannelOk = ch ? `✅ found (#${ch.name})` : "❌ not found in this server - check the ID and bot permissions";
            }

            let leaveVouchChannelOk = "N/A";
            if(CONFIG.LEAVE_VOUCH_CHANNEL_ID){
                const ch = await interaction.guild.channels.fetch(CONFIG.LEAVE_VOUCH_CHANNEL_ID).catch(() => null);
                leaveVouchChannelOk = ch ? `✅ found (#${ch.name})` : "❌ not found in this server - check the ID and bot permissions";
            }

            // The definitive answer to "does the bot actually have permission X" -
            // no more guessing based on symptoms.
            const botMember = interaction.guild.members.me;
            const botPerms = [
                "ManageChannels", "ManageRoles", "ManageMessages",
                "SendMessages", "ViewChannel", "ManageNicknames", "ModerateMembers"
            ].map(p => `${botMember.permissions.has(PermissionFlagsBits[p]) ? "✅" : "❌"} ${p}`).join("\n");

            // Live test of the Gemini API - actually calls it right now so
            // the REAL error (bad key, quota, wrong region, etc) shows up
            // directly here instead of needing to dig through Railway logs.
            let geminiStatus = "❌ GEMINI_API_KEY not set";
            if(process.env.GEMINI_API_KEY){
                try{
                    const testAnswer = await askAI("Say OK");
                    geminiStatus = testAnswer.startsWith("⚠️")
                        ? `❌ ${testAnswer.replace("⚠️ ", "")}`
                        : "✅ Working (test call succeeded)";
                }catch(err){
                    geminiStatus = `❌ ${err.message}`;
                }
            }

            const lines = checks.map(([name, ok]) => `${ok ? "✅" : "❌"} ${name}`).join("\n");

            const embed = brandEmbed({
                title: "🩺 Bot Status",
                fields: [
                    { name: "Environment", value: lines },
                    { name: "📢 Vouch channel", value: vouchChannelOk },
                    { name: "📝 Leave-vouch channel", value: leaveVouchChannelOk },
                    { name: "🤖 Gemini AI (live test)", value: geminiStatus },
                    { name: "🔑 Bot's actual server permissions", value: botPerms }
                ],
                description: "If anything above is ❌, that's almost certainly why a feature is failing."
            });

            await interaction.reply({ embeds: [embed], ephemeral: true });

        }
    },

    // ==========================================================================
    // 10 NEW COMMANDS
    // ==========================================================================

    // -- Customer rank/tier badge, based on vouch count -----------------------
    {
        data: new SlashCommandBuilder()
            .setName("rank")
            .setDescription("View your (or someone's) customer rank badge")
            .addUserOption(o => o.setName("user").setDescription("Check someone else instead").setRequired(false)),

        async execute(interaction){

            const target = interaction.options.getUser("user") || interaction.user;
            const users = usersDB.read();
            const vouches = users[target.id]?.vouches || 0;

            const tiers = [
                { name: "🥉 Bronze", min: 0, max: 2, emoji: "🥉" },
                { name: "🥈 Silver", min: 3, max: 6, emoji: "🥈" },
                { name: "🥇 Gold", min: 7, max: 14, emoji: "🥇" },
                { name: "💎 Platinum", min: 15, max: 29, emoji: "💎" },
                { name: "👑 Diamond Elite", min: 30, max: Infinity, emoji: "👑" }
            ];

            const currentIndex = tiers.findIndex(t => vouches >= t.min && vouches <= t.max);
            const current = tiers[currentIndex];
            const next = tiers[currentIndex + 1];

            let progressLine = "**MAX TIER REACHED** 🎉";
            if(next){
                const span = next.min - current.min;
                const progressInTier = vouches - current.min;
                const filled = Math.round((progressInTier / span) * 14);
                const bar = "█".repeat(filled) + "░".repeat(Math.max(0, 14 - filled));
                progressLine = `${bar}\n${vouches}/${next.min} vouches to **${next.name}**`;
            }

            const embed = brandEmbed({
                title: `${current.emoji} ${target.username}'s Customer Rank`,
                description: `## ${current.name}\n\n${progressLine}`,
                fields: [
                    { name: "📊 Total Vouches", value: `${vouches}`, inline: true },
                    { name: "🏆 Current Tier", value: current.name, inline: true }
                ]
            });

            await interaction.reply({ embeds: [embed] });

        }
    },

    // -- Multi-service bundle discount calculator ------------------------------
    {
        data: new SlashCommandBuilder()
            .setName("bundle")
            .setDescription("Combine 2-3 services for an automatic bundle discount")
            .addStringOption(o => o.setName("service1").setDescription("First service").setRequired(true)
                .addChoices(
                    { name: "Nuke (1x)", value: "nuke_1" },
                    { name: "Rank Boost: Bronze → Iridescent", value: "rank_full" },
                    { name: "Camo Grinding (full path)", value: "camo_full" },
                    { name: "Endgame Operator", value: "endgame" },
                    { name: "Number Rental", value: "number" }
                ))
            .addStringOption(o => o.setName("service2").setDescription("Second service").setRequired(true)
                .addChoices(
                    { name: "Nuke (1x)", value: "nuke_1" },
                    { name: "Rank Boost: Bronze → Iridescent", value: "rank_full" },
                    { name: "Camo Grinding (full path)", value: "camo_full" },
                    { name: "Endgame Operator", value: "endgame" },
                    { name: "Number Rental", value: "number" }
                ))
            .addStringOption(o => o.setName("service3").setDescription("Third service (optional)").setRequired(false)
                .addChoices(
                    { name: "Nuke (1x)", value: "nuke_1" },
                    { name: "Rank Boost: Bronze → Iridescent", value: "rank_full" },
                    { name: "Camo Grinding (full path)", value: "camo_full" },
                    { name: "Endgame Operator", value: "endgame" },
                    { name: "Number Rental", value: "number" }
                )),

        async execute(interaction){

            const prices = {
                nuke_1: { label: "Nuke (1x)", price: 79.99 },
                rank_full: { label: "Rank Boost: Bronze → Iridescent", price: 250 },
                camo_full: { label: "Camo Grinding (full path)", price: 120 },
                endgame: { label: "Endgame Operator", price: 45 },
                number: { label: "Number Rental", price: 5 }
            };

            const picks = [interaction.options.getString("service1"), interaction.options.getString("service2"), interaction.options.getString("service3")]
                .filter(Boolean);

            const chosen = picks.map(p => prices[p]);
            const subtotal = chosen.reduce((sum, s) => sum + s.price, 0);
            const discountPercent = chosen.length >= 3 ? 15 : 10;
            const discount = subtotal * (discountPercent / 100);
            const total = subtotal - discount;

            const embed = brandEmbed({
                title: "📦 Bundle Deal Calculator",
                description: chosen.map(s => `• ${s.label} — $${s.price.toFixed(2)}`).join("\n"),
                fields: [
                    { name: "Subtotal", value: `$${subtotal.toFixed(2)}`, inline: true },
                    { name: `Bundle Discount (${discountPercent}%)`, value: `-$${discount.toFixed(2)}`, inline: true },
                    { name: "💰 Total", value: `**$${total.toFixed(2)}**`, inline: true },
                    { name: "Next step", value: "Open a ticket and mention this bundle to lock in the price." }
                ]
            });

            await interaction.reply({ embeds: [embed] });

        }
    },

    // -- Daily loot crate: chance at a random discount code --------------------

    // -- Daily check-in streak ---------------------------------------------------

    // -- 1v1 coinflip duel for bragging rights -----------------------------------

    // -- Staff: post a gallery-style showcase of a finished order/testimonial --
    {
        data: new SlashCommandBuilder()
            .setName("showcase")
            .setDescription("Staff: post a testimonial/order showcase with images")
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
            .addStringOption(o => o.setName("title").setDescription("Showcase title").setRequired(true))
            .addStringOption(o => o.setName("description").setDescription("What happened / what was delivered").setRequired(true))
            .addStringOption(o => o.setName("image1").setDescription("Image URL").setRequired(true))
            .addStringOption(o => o.setName("image2").setDescription("Image URL").setRequired(false))
            .addStringOption(o => o.setName("image3").setDescription("Image URL").setRequired(false))
            .addStringOption(o => o.setName("image4").setDescription("Image URL").setRequired(false)),

        async execute(interaction){

            if(!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)){
                return interaction.reply({ content: "❌ No permission.", ephemeral: true });
            }

            const title = interaction.options.getString("title");
            const description = interaction.options.getString("description");
            const images = [1, 2, 3, 4].map(n => interaction.options.getString(`image${n}`)).filter(Boolean);

            const galleryUrl = "https://discord.com/";

            const mainEmbed = brandEmbed({
                title: `🏆 ${title}`,
                description
            }).setURL(galleryUrl).setImage(images[0]);

            const extraEmbeds = images.slice(1).map(url =>
                new EmbedBuilder().setURL(galleryUrl).setImage(url).setColor(CONFIG.COLOR)
            );

            await interaction.reply({ embeds: [mainEmbed, ...extraEmbeds] });

        }
    },

    // -- Staff: post a styled feature roadmap/timeline ----------------------------

    // -- Side-by-side service comparison ------------------------------------------
    {
        data: new SlashCommandBuilder()
            .setName("compare")
            .setDescription("Compare two services side-by-side")
            .addStringOption(o => o.setName("service1").setDescription("First service").setRequired(true)
                .addChoices(
                    { name: "Nuke (1x)", value: "nuke_1" },
                    { name: "Rank Boost: Bronze → Iridescent", value: "rank_full" },
                    { name: "Camo Grinding (full path)", value: "camo_full" },
                    { name: "Endgame Operator", value: "endgame" }
                ))
            .addStringOption(o => o.setName("service2").setDescription("Second service").setRequired(true)
                .addChoices(
                    { name: "Nuke (1x)", value: "nuke_1" },
                    { name: "Rank Boost: Bronze → Iridescent", value: "rank_full" },
                    { name: "Camo Grinding (full path)", value: "camo_full" },
                    { name: "Endgame Operator", value: "endgame" }
                )),

        async execute(interaction){

            const info = {
                nuke_1: { label: "☢️ Nuke (1x)", price: "$79.99", turnaround: "Same-day (scheduled)", reward: "Nuke calling card, spray, camo & operator" },
                rank_full: { label: "⚔️ Rank Boost (Full)", price: "$250", turnaround: "1-3 days", reward: "Bronze → Iridescent rank" },
                camo_full: { label: "🎨 Camo Grinding (Full)", price: "$120", turnaround: "3-5 days", reward: "Full mastery camo path" },
                endgame: { label: "⚡ Endgame Operator", price: "$45", turnaround: "Same-day", reward: "Unlocked endgame operator skin" }
            };

            const a = info[interaction.options.getString("service1")];
            const b = info[interaction.options.getString("service2")];

            const embed = brandEmbed({
                title: "📊 Service Comparison",
                fields: [
                    { name: a.label, value: `💰 ${a.price}\n⏱️ ${a.turnaround}\n🎁 ${a.reward}`, inline: true },
                    { name: b.label, value: `💰 ${b.price}\n⏱️ ${b.turnaround}\n🎁 ${b.reward}`, inline: true }
                ]
            });

            await interaction.reply({ embeds: [embed] });

        }
    },

    // -- Fun "server hype" stock-style ticker -------------------------------------

    // -- Personal achievements grid -------------------------------------------------

    // ==========================================================================
    // BATCH 2: 13 more commands - customer conversion, retention, staff ops
    // ==========================================================================

    // -- Staff: nudge a customer to leave a vouch after their order -----------
    {
        data: new SlashCommandBuilder()
            .setName("reviewreminder")
            .setDescription("Staff: remind a customer to leave a vouch")
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
            .addUserOption(o => o.setName("user").setDescription("Who to remind").setRequired(true))
            .addStringOption(o => o.setName("method").setDescription("How to send it").setRequired(true)
                .addChoices({ name: "DM them", value: "dm" }, { name: "Ping them here", value: "ping" })),

        async execute(interaction){

            if(!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)){
                return interaction.reply({ content: "❌ No permission.", ephemeral: true });
            }

            const target = interaction.options.getUser("user");
            const method = interaction.options.getString("method");

            const embed = brandEmbed({
                title: "⭐ How Was Your Order?",
                description:
                    `Hey! Thanks for choosing **${CONFIG.BRAND_NAME}**. If you've got a minute, we'd really appreciate a quick vouch — ` +
                    `it takes less than a minute and helps other customers trust us.\n\n` +
                    `Head to <#${CONFIG.LEAVE_VOUCH_CHANNEL_ID || ""}> and click **Leave a Vouch** whenever you're ready!`
            });

            if(method === "dm"){
                try{
                    await target.send({ embeds: [embed] });
                    await interaction.reply({ content: `✅ Sent a review reminder to ${target} via DM.`, ephemeral: true });
                }catch{
                    await interaction.reply({ content: `❌ Couldn't DM ${target} - they may have DMs closed. Try the "ping" method instead.`, ephemeral: true });
                }
            }else{
                await interaction.reply({ content: `${target}`, embeds: [embed] });
            }

        }
    },

    // -- Instant price lookup with autocomplete --------------------------------
    {
        data: new SlashCommandBuilder()
            .setName("pricecheck")
            .setDescription("Instantly check the price of a service")
            .addStringOption(o => o.setName("service").setDescription("Start typing a service name").setRequired(true).setAutocomplete(true)),

        async autocomplete(interaction){
            const focused = interaction.options.getFocused().toLowerCase();
            const matches = SERVICE_CATALOG.filter(s => s.label.toLowerCase().includes(focused)).slice(0, 25);
            await interaction.respond(matches.map(s => ({ name: s.label, value: s.value })));
        },

        async execute(interaction){
            const service = SERVICE_CATALOG.find(s => s.value === interaction.options.getString("service"));

            if(!service){
                return interaction.reply({ content: "❌ Couldn't find that service - pick one from the autocomplete list.", ephemeral: true });
            }

            const embed = brandEmbed({
                title: service.label,
                fields: [
                    { name: "💰 Price", value: service.price, inline: true },
                    { name: "⏱️ Turnaround", value: service.turnaround, inline: true },
                    { name: "🎁 You Get", value: service.reward }
                ]
            });

            await interaction.reply({ embeds: [embed] });
        }
    },

    // -- Join a waitlist for a sold-out/high-demand service --------------------
    {
        data: new SlashCommandBuilder()
            .setName("waitlist")
            .setDescription("Join the waitlist for a service")
            .addStringOption(o => o.setName("service").setDescription("Which service (e.g. nuke, camo-grinding)").setRequired(true)),

        async execute(interaction){

            const service = interaction.options.getString("service").trim().toLowerCase();
            const lists = waitlistDB.read();
            lists[service] = lists[service] || [];

            if(lists[service].includes(interaction.user.id)){
                return interaction.reply({ content: `❌ You're already on the waitlist for **${service}**.`, ephemeral: true });
            }

            lists[service].push(interaction.user.id);
            waitlistDB.write(lists);

            const embed = brandEmbed({
                title: "📋 Added to Waitlist",
                description: `You're **#${lists[service].length}** in line for **${service}**. We'll ping you the moment a slot opens!`
            });

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },

    // -- Staff: ping everyone on a waitlist and clear it -----------------------
    {
        data: new SlashCommandBuilder()
            .setName("waitlistping")
            .setDescription("Staff: notify everyone waitlisted for a service")
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
            .addStringOption(o => o.setName("service").setDescription("Which service").setRequired(true).setAutocomplete(true)),

        async autocomplete(interaction){
            const focused = interaction.options.getFocused().toLowerCase();
            const lists = waitlistDB.read();
            const matches = Object.keys(lists).filter(s => s.includes(focused)).slice(0, 25);
            await interaction.respond(matches.map(s => ({ name: `${s} (${lists[s].length} waiting)`, value: s })));
        },

        async execute(interaction){

            if(!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)){
                return interaction.reply({ content: "❌ No permission.", ephemeral: true });
            }

            const service = interaction.options.getString("service").trim().toLowerCase();
            const lists = waitlistDB.read();
            const waiting = lists[service] || [];

            if(waiting.length === 0){
                return interaction.reply({ content: `❌ No one is waitlisted for **${service}**.`, ephemeral: true });
            }

            const embed = brandEmbed({
                title: "🔔 Slots Are Open!",
                description: `**${service}** just opened back up! First come, first served — open a ticket now.`
            });

            await interaction.reply({ content: waiting.map(id => `<@${id}>`).join(" "), embeds: [embed] });

            delete lists[service];
            waitlistDB.write(lists);
        }
    },

    // -- Daily loyalty points (separate lightweight track from /streak) -------

    // -- Referral leaderboard (separate from the vouch leaderboard) -----------

    // -- Staff: see every open ticket, oldest first ----------------------------
    {
        data: new SlashCommandBuilder()
            .setName("queue")
            .setDescription("Staff: see all open tickets, oldest first")
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

        async execute(interaction){

            if(!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)){
                return interaction.reply({ content: "❌ No permission.", ephemeral: true });
            }

            const log = ticketLogDB.read();
            const open = log.open.filter(t => !t.closedBy).sort((a, b) => new Date(a.created) - new Date(b.created));

            if(open.length === 0){
                return interaction.reply({ content: "✅ No open tickets right now - queue is clear!", ephemeral: true });
            }

            const lines = open.slice(0, 20).map((t, i) => {
                const ageMin = Math.round((Date.now() - new Date(t.created).getTime()) / 60000);
                const claimed = t.claimedBy ? `claimed by <@${t.claimedBy}>` : "⚠️ **unclaimed**";
                return `**${i + 1}.** <#${t.channelId}> — ${t.service || "unknown"} — ${ageMin}min old — ${claimed}`;
            }).join("\n");

            const embed = brandEmbed({
                title: `📋 Ticket Queue (${open.length} open)`,
                description: lines
            });

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },

    // -- Staff: weekly claim/close leaderboard ---------------------------------
    {
        data: new SlashCommandBuilder()
            .setName("staffleaderboard")
            .setDescription("Staff: see who's claimed/closed the most tickets this week")
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

        async execute(interaction){

            if(!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)){
                return interaction.reply({ content: "❌ No permission.", ephemeral: true });
            }

            const log = ticketLogDB.read();
            const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
            const counts = {};

            for(const t of log.open){
                const openedAt = new Date(t.created).getTime();
                if(openedAt < oneWeekAgo) continue;
                if(t.closedBy){
                    counts[t.closedBy] = counts[t.closedBy] || { claimed: 0, closed: 0 };
                    counts[t.closedBy].closed++;
                }
                if(t.claimedBy){
                    counts[t.claimedBy] = counts[t.claimedBy] || { claimed: 0, closed: 0 };
                    counts[t.claimedBy].claimed++;
                }
            }

            const sorted = Object.entries(counts).sort((a, b) => b[1].closed - a[1].closed);
            const medals = ["🥇", "🥈", "🥉"];

            const lines = sorted.length
                ? sorted.map(([id, s], i) => `${medals[i] || `**${i + 1}.**`} <@${id}> — ${s.closed} closed, ${s.claimed} claimed`).join("\n")
                : "No ticket activity in the past 7 days.";

            const embed = brandEmbed({
                title: "🏆 This Week's Top Staff",
                description: lines
            });

            await interaction.reply({ embeds: [embed] });
        }
    },

    // -- Staff: private internal notes on a customer ---------------------------
    {
        data: new SlashCommandBuilder()
            .setName("note")
            .setDescription("Staff: add or view private internal notes on a customer")
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
            .addSubcommand(sc => sc.setName("add").setDescription("Add a note")
                .addUserOption(o => o.setName("user").setDescription("Customer").setRequired(true))
                .addStringOption(o => o.setName("text").setDescription("Note content").setRequired(true)))
            .addSubcommand(sc => sc.setName("view").setDescription("View notes")
                .addUserOption(o => o.setName("user").setDescription("Customer").setRequired(true))),

        async execute(interaction){

            if(!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)){
                return interaction.reply({ content: "❌ No permission.", ephemeral: true });
            }

            const sub = interaction.options.getSubcommand();
            const target = interaction.options.getUser("user");
            const notes = notesDB.read();

            if(sub === "add"){
                const text = interaction.options.getString("text");
                notes[target.id] = notes[target.id] || [];
                notes[target.id].push({ staffId: interaction.user.id, note: text, at: new Date().toISOString() });
                notesDB.write(notes);
                return interaction.reply({ content: `✅ Note added for ${target}.`, ephemeral: true });
            }

            const userNotes = notes[target.id] || [];
            if(userNotes.length === 0){
                return interaction.reply({ content: `No notes on file for ${target}.`, ephemeral: true });
            }

            const lines = userNotes.map(n => `• *${new Date(n.at).toLocaleDateString()}* — ${n.note} *(by <@${n.staffId}>)*`).join("\n");

            const embed = brandEmbed({
                title: `📝 Notes on ${target.username}`,
                description: lines
            });

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },

    // -- Staff: blacklist lookup/management ------------------------------------
    {
        data: new SlashCommandBuilder()
            .setName("blacklist")
            .setDescription("Staff: manage the customer blacklist")
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
            .addSubcommand(sc => sc.setName("add").setDescription("Blacklist a user")
                .addUserOption(o => o.setName("user").setDescription("User").setRequired(true))
                .addStringOption(o => o.setName("reason").setDescription("Why").setRequired(true)))
            .addSubcommand(sc => sc.setName("remove").setDescription("Remove a user from the blacklist")
                .addUserOption(o => o.setName("user").setDescription("User").setRequired(true)))
            .addSubcommand(sc => sc.setName("check").setDescription("Check if a user is blacklisted")
                .addUserOption(o => o.setName("user").setDescription("User").setRequired(true))),

        async execute(interaction){

            if(!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)){
                return interaction.reply({ content: "❌ No permission.", ephemeral: true });
            }

            const sub = interaction.options.getSubcommand();
            const target = interaction.options.getUser("user");
            const list = blacklistDB.read();

            if(sub === "add"){
                const reason = interaction.options.getString("reason");
                list[target.id] = { reason, addedBy: interaction.user.id, at: new Date().toISOString() };
                blacklistDB.write(list);
                return interaction.reply({ content: `🚫 ${target} has been blacklisted: ${reason}` });
            }

            if(sub === "remove"){
                if(!list[target.id]){
                    return interaction.reply({ content: `${target} isn't blacklisted.`, ephemeral: true });
                }
                delete list[target.id];
                blacklistDB.write(list);
                return interaction.reply({ content: `✅ ${target} removed from the blacklist.` });
            }

            // check
            const entry = list[target.id];
            if(!entry){
                return interaction.reply({ content: `✅ ${target} is not blacklisted.`, ephemeral: true });
            }

            const embed = brandEmbed({
                title: "🚫 Blacklisted",
                fields: [
                    { name: "User", value: `${target}`, inline: true },
                    { name: "Added by", value: `<@${entry.addedBy}>`, inline: true },
                    { name: "Reason", value: entry.reason },
                    { name: "Date", value: new Date(entry.at).toLocaleDateString() }
                ]
            });

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },

    // -- Preset announcement templates ------------------------------------------
    {
        data: new SlashCommandBuilder()
            .setName("announcement")
            .setDescription("Staff: post a styled announcement from a template")
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
            .addStringOption(o => o.setName("type").setDescription("Announcement type").setRequired(true)
                .addChoices(
                    { name: "🎉 Sale", value: "sale" },
                    { name: "📦 Restock", value: "restock" },
                    { name: "🛠️ Downtime", value: "downtime" },
                    { name: "📋 Patch Notes", value: "patch" }
                ))
            .addStringOption(o => o.setName("message").setDescription("The announcement content").setRequired(true)),

        async execute(interaction){

            if(!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)){
                return interaction.reply({ content: "❌ No permission.", ephemeral: true });
            }

            const type = interaction.options.getString("type");
            const message = interaction.options.getString("message");

            const templates = {
                sale: { title: "🎉 SALE IS LIVE!", color: "#FF1493" },
                restock: { title: "📦 RESTOCKED!", color: "#43B581" },
                downtime: { title: "🛠️ SCHEDULED DOWNTIME", color: "#FFA500" },
                patch: { title: "📋 PATCH NOTES", color: "#3498DB" }
            };

            const template = templates[type];

            const embed = new EmbedBuilder()
                .setColor(template.color)
                .setTitle(template.title)
                .setDescription(message)
                .setFooter({ text: CONFIG.BRAND_NAME })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        }
    },

    // -- Manually re-post a random past vouch to keep a channel lively --------

    // ==========================================================================
    // BATCH 3: order tracking, dashboard, stock system, scheduling
    // ==========================================================================

    // -- Public order status lookup by order ID --------------------------------
    {
        data: new SlashCommandBuilder()
            .setName("trackorder")
            .setDescription("Check the status of your order")
            .addStringOption(o => o.setName("order_id").setDescription("e.g. ORD-1001").setRequired(true)),

        async execute(interaction){

            const orderId = interaction.options.getString("order_id").trim().toUpperCase();
            const log = ticketLogDB.read();
            const ticket = log.open.find(t => t.orderId?.toUpperCase() === orderId);

            if(!ticket){
                return interaction.reply({ content: `❌ No order found with ID \`${orderId}\`.`, ephemeral: true });
            }

            if(ticket.user !== interaction.user.id && !interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)){
                return interaction.reply({ content: "❌ You can only track your own orders.", ephemeral: true });
            }

            const statusEmoji = { pending: "🟡", in_progress: "🟠", started: "🟡", halfway: "🟠", completed: "✅" }[ticket.status] || "⚪";
            const statusLabel = { pending: "Pending", in_progress: "In Progress", started: "Started", halfway: "Halfway Done", completed: "Completed" }[ticket.status] || ticket.status;

            const embed = brandEmbed({
                title: `${statusEmoji} Order ${ticket.orderId}`,
                fields: [
                    { name: "Service", value: ticket.service, inline: true },
                    { name: "Status", value: statusLabel, inline: true },
                    { name: "💳 Payment", value: ticket.paymentConfirmed ? "✅ Confirmed" : "⏳ Not confirmed yet", inline: true },
                    { name: "🙋 Claimed By", value: ticket.claimedBy ? `<@${ticket.claimedBy}>` : "Not yet claimed", inline: true },
                    { name: "📅 Opened", value: new Date(ticket.created).toLocaleString() }
                ]
            });

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },

    // -- One-stop customer profile dashboard -----------------------------------
    {
        data: new SlashCommandBuilder()
            .setName("myaccount")
            .setDescription("View your account dashboard"),

        async execute(interaction){

            const users = usersDB.read();
            const record = users[interaction.user.id] || { vouches: 0 };
            const log = ticketLogDB.read();
            const discounts = discountsDB.read();

            const openTickets = log.open.filter(t => t.user === interaction.user.id && !t.closedBy).length;
            const myDiscounts = Object.entries(discounts).filter(([, d]) => d.usesLeft > 0);

            const tiers = [
                { name: "🥉 Bronze", min: 0, max: 2 },
                { name: "🥈 Silver", min: 3, max: 6 },
                { name: "🥇 Gold", min: 7, max: 14 },
                { name: "💎 Platinum", min: 15, max: 29 },
                { name: "👑 Diamond Elite", min: 30, max: Infinity }
            ];
            const tier = tiers.find(t => (record.vouches || 0) >= t.min && (record.vouches || 0) <= t.max);

            const embed = new EmbedBuilder()
                .setColor("#00CFFF")
                .setAuthor({ name: `${interaction.user.tag}'s Dashboard`, iconURL: interaction.user.displayAvatarURL() })
                .addFields(
                    { name: "🏆 Rank Tier", value: tier.name, inline: true },
                    { name: "⭐ Vouches", value: `${record.vouches || 0}`, inline: true },
                    { name: "🔥 Streak", value: `${record.streak || 0} days`, inline: true },
                    { name: "💰 Points", value: `${record.points || 0}`, inline: true },
                    { name: "⚔️ Duel Record", value: `${record.duelWins || 0}W - ${record.duelLosses || 0}L`, inline: true },
                    { name: "🎫 Open Tickets", value: `${openTickets}`, inline: true },
                    { name: "🎟️ Active Discount Codes", value: myDiscounts.length ? myDiscounts.map(([c, d]) => `\`${c}\` (${d.percent}% off)`).join("\n") : "None right now" }
                )
                .setFooter({ text: CONFIG.BRAND_NAME })
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },

    // -- Staff: set stock status on a service -----------------------------------
    {
        data: new SlashCommandBuilder()
            .setName("setstock")
            .setDescription("Staff: set a service's stock status")
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
            .addStringOption(o => o.setName("service").setDescription("Service name").setRequired(true))
            .addStringOption(o => o.setName("status").setDescription("Stock status").setRequired(true)
                .addChoices(
                    { name: "✅ In Stock", value: "in_stock" },
                    { name: "⚠️ Limited", value: "limited" },
                    { name: "❌ Sold Out", value: "sold_out" }
                )),

        async execute(interaction){

            if(!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)){
                return interaction.reply({ content: "❌ No permission.", ephemeral: true });
            }

            const service = interaction.options.getString("service").trim().toLowerCase();
            const status = interaction.options.getString("status");
            const stock = stockDB.read();
            const previousStatus = stock[service];
            stock[service] = status;
            stockDB.write(stock);

            const labels = { in_stock: "✅ In Stock", limited: "⚠️ Limited", sold_out: "❌ Sold Out" };
            await interaction.reply({ content: `Updated **${service}** to ${labels[status]}.` });

            // Auto-ping the waitlist if this service just came back in stock
            if(status === "in_stock" && previousStatus === "sold_out"){
                const lists = waitlistDB.read();
                const waiting = lists[service] || [];
                if(waiting.length){
                    const embed = brandEmbed({
                        title: "🔔 Slots Are Open!",
                        description: `**${service}** just came back in stock! First come, first served — open a ticket now.`
                    });
                    await interaction.channel.send({ content: waiting.map(id => `<@${id}>`).join(" "), embeds: [embed] }).catch(() => {});
                    delete lists[service];
                    waitlistDB.write(lists);
                }
            }
        }
    },

    // -- Public stock check -------------------------------------------------------
    {
        data: new SlashCommandBuilder()
            .setName("stock")
            .setDescription("Check if a service is in stock")
            .addStringOption(o => o.setName("service").setDescription("Service name").setRequired(true)),

        async execute(interaction){

            const service = interaction.options.getString("service").trim().toLowerCase();
            const stock = stockDB.read();
            const status = stock[service] || "in_stock";
            const labels = { in_stock: "✅ In Stock", limited: "⚠️ Limited Slots", sold_out: "❌ Sold Out - join the waitlist with `/waitlist`" };

            const embed = brandEmbed({
                title: `📦 ${service}`,
                description: labels[status]
            });

            await interaction.reply({ embeds: [embed] });
        }
    },

    // -- Staff: schedule an announcement for later --------------------------------
    {
        data: new SlashCommandBuilder()
            .setName("schedule")
            .setDescription("Staff: schedule an announcement to post later")
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
            .addIntegerOption(o => o.setName("minutes_from_now").setDescription("How many minutes from now to post").setRequired(true))
            .addStringOption(o => o.setName("type").setDescription("Announcement style").setRequired(true)
                .addChoices(
                    { name: "🎉 Sale", value: "sale" },
                    { name: "📦 Restock", value: "restock" },
                    { name: "🛠️ Downtime", value: "downtime" },
                    { name: "📋 Patch Notes", value: "patch" }
                ))
            .addStringOption(o => o.setName("message").setDescription("The announcement content").setRequired(true)),

        async execute(interaction){

            if(!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)){
                return interaction.reply({ content: "❌ No permission.", ephemeral: true });
            }

            const minutes = interaction.options.getInteger("minutes_from_now");
            const type = interaction.options.getString("type");
            const message = interaction.options.getString("message");

            const schedule = scheduleDB.read();
            const id = `sched_${Date.now()}`;
            schedule.push({
                id, channelId: interaction.channel.id, postAt: Date.now() + minutes * 60 * 1000,
                type, message, posted: false
            });
            scheduleDB.write(schedule);

            await interaction.reply({ content: `✅ Scheduled! This will post in ${interaction.channel} in ${minutes} minute(s).`, ephemeral: true });
        }
    },

    // -- Check your XP/level ------------------------------------------------------

];

// ---------------------------------------------------------------------------
// BUTTON HANDLERS (customId -> function)
// ---------------------------------------------------------------------------

const buttonHandlers = {

    async verify_button(interaction){

        if(!CONFIG.VERIFIED_ROLE_ID){
            return interaction.reply({
                content: "❌ Verification isn't configured yet - staff needs to set `VERIFIED_ROLE_ID`.",
                ephemeral: true
            });
        }

        const member = interaction.member;

        if(member.roles.cache.has(CONFIG.VERIFIED_ROLE_ID)){
            return interaction.reply({ content: "✅ You're already verified!", ephemeral: true });
        }

        try{
            await member.roles.add(CONFIG.VERIFIED_ROLE_ID);
        }catch(err){
            console.log(`[verify] ❌ could not add verified role: ${err.message}`);
            return interaction.reply({
                content: `❌ Couldn't verify you (\`${err.message}\`). This usually means the bot's role needs **Manage Roles**, or its role sits below the verified role - ask staff to check.`,
                ephemeral: true
            });
        }

        await interaction.reply({ content: "✅ You're verified! Welcome to the server.", ephemeral: true });

        await securityLog(interaction.guild, {
            title: "✅ Member Verified",
            description: `**User:** ${interaction.user} (${interaction.user.id})`,
            color: "#00FF00"
        });

    },

    // -- 2-step Cloudflare-style emoji challenge --------------------------
    async verify_start(interaction){

        if(!CONFIG.VERIFIED_ROLE_ID){
            return interaction.reply({
                content: "❌ Verification isn't configured yet - staff needs to set `VERIFIED_ROLE_ID`.",
                ephemeral: true
            });
        }

        if(interaction.member.roles.cache.has(CONFIG.VERIFIED_ROLE_ID)){
            return interaction.reply({ content: "✅ You're already verified!", ephemeral: true });
        }

        const challenge = buildVerifyChallenge();
        challenge.expires = Date.now() + 2 * 60 * 1000;
        verifySessions.set(interaction.user.id, challenge);
        setTimeout(() => {
            const current = verifySessions.get(interaction.user.id);
            if(current === challenge) verifySessions.delete(interaction.user.id);
        }, 2 * 60 * 1000 + 5000);

        const embed = brandEmbed({
            title: "☁️ Step 2 of 2 — Prove You're Human",
            color: "#F6821F",
            thumbnail: false,
            description:
                `Click the button below that matches this emoji:\n\n` +
                `# ${challenge.target}\n\n` +
                `⏳ This challenge expires in 2 minutes.`
        });

        const row = new ActionRowBuilder().addComponents(
            challenge.order.map((emoji, i) =>
                new ButtonBuilder().setCustomId(`verify_pick_${i}`).setEmoji(emoji).setStyle(ButtonStyle.Secondary)
            )
        );

        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });

    },

    async verify_pick_0(interaction){ await handleVerifyPick(interaction, 0); },
    async verify_pick_1(interaction){ await handleVerifyPick(interaction, 1); },
    async verify_pick_2(interaction){ await handleVerifyPick(interaction, 2); },
    async verify_pick_3(interaction){ await handleVerifyPick(interaction, 3); },

    // -- Leave a Vouch: opens a private channel for a guided 3-step flow
    // (rating → comment → optional photo), posts the final result, then
    // auto-deletes the private channel so it doesn't pile up messages. ------
    async leave_vouch(interaction){

        const existing = interaction.guild.channels.cache.find(
            c => c.name === `vouch-${interaction.user.username}`.toLowerCase()
        );
        if(existing){
            return interaction.reply({ content: `❌ You already have a vouch in progress: ${existing}`, ephemeral: true });
        }

        let channel;
        try{
            channel = await interaction.guild.channels.create({
                name: `vouch-${interaction.user.username}`.toLowerCase(),
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                    { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
                    { id: interaction.client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ReadMessageHistory] }
                ]
            });
        }catch(err){
            console.log(`[vouch] ❌ could not create private channel: ${err.message}`);
            return interaction.reply({
                content: `❌ Couldn't set up your vouch channel (\`${err.message}\`). Ask staff to check the bot's Manage Channels/Manage Roles permission.`,
                ephemeral: true
            });
        }

        await interaction.reply({ content: `✅ Head to ${channel} to leave your vouch!`, ephemeral: true });

        const stepEmbed = new EmbedBuilder()
            .setColor("#FFD700")
            .setTitle("⭐ Step 1 of 3 — Rate Your Experience")
            .setDescription("How would you rate your order? Pick a star rating below.")
            .setFooter({ text: CONFIG.BRAND_NAME });

        const ratingRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("vouch_rating_1").setLabel("1").setEmoji("⭐").setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId("vouch_rating_2").setLabel("2").setEmoji("⭐").setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId("vouch_rating_3").setLabel("3").setEmoji("⭐").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId("vouch_rating_4").setLabel("4").setEmoji("⭐").setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId("vouch_rating_5").setLabel("5").setEmoji("⭐").setStyle(ButtonStyle.Success)
        );

        await channel.send({ content: `${interaction.user}`, embeds: [stepEmbed], components: [ratingRow] }).catch(() => {});

    },

    async vouch_rating_1(interaction){ await handleVouchRating(interaction, 1); },
    async vouch_rating_2(interaction){ await handleVouchRating(interaction, 2); },
    async vouch_rating_3(interaction){ await handleVouchRating(interaction, 3); },
    async vouch_rating_4(interaction){ await handleVouchRating(interaction, 4); },
    async vouch_rating_5(interaction){ await handleVouchRating(interaction, 5); },

    async vouch_photo_yes(interaction){

        await interaction.update({
            embeds: [
                new EmbedBuilder()
                    .setColor("#FFD700")
                    .setTitle("📸 Step 3 of 3 — Upload Your Screenshot")
                    .setDescription("Send your screenshot here as an attachment. You have 3 minutes.")
                    .setFooter({ text: CONFIG.BRAND_NAME })
            ],
            components: []
        });

        const session = vouchSessions.get(interaction.channel.id);
        if(!session) return;

        let collected;
        try{
            collected = await interaction.channel.awaitMessages({
                filter: m => m.author.id === interaction.user.id && m.attachments.size > 0,
                max: 1,
                time: 3 * 60 * 1000,
                errors: ["time"]
            });
        }catch{
            await interaction.channel.send({ content: "⌛ No screenshot received in time - posting your vouch without one." }).catch(() => {});
            return finalizeVouch(interaction, session, null);
        }

        const imageUrl = collected.first().attachments.first().url;
        await finalizeVouch(interaction, session, imageUrl);

    },

    async vouch_photo_skip(interaction){
        const session = vouchSessions.get(interaction.channel.id);
        if(!session) return;
        await interaction.update({ components: [] });
        await finalizeVouch(interaction, session, null);
    },

    async giveaway_enter(interaction){
        const giveaways = giveawaysDB.read();
        const g = giveaways[interaction.message.id];

        if(!g || g.ended){
            return interaction.reply({ content: "❌ This giveaway has ended.", ephemeral: true });
        }
        if(g.entries.includes(interaction.user.id)){
            return interaction.reply({ content: "✅ You're already entered.", ephemeral: true });
        }
        g.entries.push(interaction.user.id);
        giveawaysDB.write(giveaways);
        await interaction.reply({ content: "🎉 You're entered!", ephemeral: true });

        // Update the entry count shown on the giveaway embed itself
        const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[0]);
        const fields = updatedEmbed.data.fields.map(f =>
            f.name === "👥 Entries" ? { ...f, value: `${g.entries.length}` } : f
        );
        updatedEmbed.setFields(fields);
        await interaction.message.edit({ embeds: [updatedEmbed] }).catch(() => {});
    },

    async giveaway_entries(interaction){
        const giveaways = giveawaysDB.read();
        const g = giveaways[interaction.message.id];

        if(!g){
            return interaction.reply({ content: "❌ Giveaway not found.", ephemeral: true });
        }
        if(!g.entries.length){
            return interaction.reply({ content: "No one has entered yet.", ephemeral: true });
        }

        const list = g.entries.slice(0, 50).map((id, i) => `${i + 1}. <@${id}>`).join("\n");
        await interaction.reply({
            content: `**👥 Entries for ${g.prize}** (${g.entries.length} total)\n${list}${g.entries.length > 50 ? `\n*...and ${g.entries.length - 50} more*` : ""}`,
            ephemeral: true
        });
    },

    async claim_ticket(interaction){
        if(!isTicketStaff(interaction.member)){
            return interaction.reply({ content: "❌ Only staff can claim tickets.", ephemeral: true });
        }

        await interaction.channel.permissionOverwrites.edit(interaction.user.id, {
            ViewChannel: true, SendMessages: true
        });

        const log = ticketLogDB.read();
        const ticket = log.open.find(t => t.channelId === interaction.channel.id);
        if(ticket){
            ticket.status = "in_progress";
            ticket.claimedBy = interaction.user.id;
            ticketLogDB.write(log);
        }

        await interaction.reply({ content: `🙋 Claimed by ${interaction.user}` });
    },

    async order_started(interaction){
        await updateOrderStatus(interaction, "started", "🟡 Order Started", "Staff has begun working on this order.");
    },

    async order_halfway(interaction){
        await updateOrderStatus(interaction, "halfway", "🟠 Halfway Done", "This order is about halfway complete.");
    },

    async order_complete(interaction){
        await updateOrderStatus(interaction, "completed", "✅ Order Complete", "This order has been completed! Thank you for choosing us — feel free to leave a vouch.");
    },

    // -- Payment proof flow: customer flags they've paid, staff confirms ------
    async payment_proof_upload(interaction){

        await interaction.reply({
            content: `📸 ${interaction.user}, please upload a screenshot of your payment confirmation right here in this ticket. Staff will confirm it once they see it.`
        });
    },

    async payment_proof_confirm(interaction){

        if(!isTicketStaff(interaction.member)){
            return interaction.reply({ content: "❌ Only staff can confirm payment.", ephemeral: true });
        }

        const log = ticketLogDB.read();
        const ticket = log.open.find(t => t.channelId === interaction.channel.id);
        if(ticket){
            ticket.paymentConfirmed = true;
            ticket.paymentConfirmedBy = interaction.user.id;
            ticketLogDB.write(log);
        }

        const embed = brandEmbed({
            title: "✅ Payment Confirmed",
            color: "#43B581",
            description: `Payment has been confirmed by ${interaction.user}. Order is moving forward!`
        });

        await interaction.reply({ embeds: [embed] });
    },

    async close_ticket(interaction){
        await interaction.reply({ content: "🔒 Generating transcript, then closing in 5 seconds..." });

        const channel = interaction.channel;

        const log = ticketLogDB.read();
        const ticket = log.open.find(t => t.channelId === channel.id);
        if(ticket){
            ticket.status = "completed";
            ticket.closedBy = interaction.user.id;
            ticket.closedAt = new Date().toISOString();
            ticketLogDB.write(log);
        }

        try{
            const messages = await channel.messages.fetch({ limit: 100 });
            const sorted = [...messages.values()].reverse();

            const lines = sorted.map(m => {
                const time = new Date(m.createdTimestamp).toISOString();
                const content = m.content || (m.embeds.length ? "[embed]" : "[no content]");
                return `[${time}] ${m.author.tag}: ${content}`;
            });

            const transcript = lines.join("\n") || "No messages.";
            const buffer = Buffer.from(transcript, "utf8");
            const file = { attachment: buffer, name: `${channel.name}-transcript.txt` };

            if(ticket){
                try{
                    const customer = await interaction.client.users.fetch(ticket.user);
                    await customer.send({
                        content: `📄 Here's a transcript of your ticket **#${channel.name}** with **${CONFIG.BRAND_NAME}**. Thanks for your business!`,
                        files: [{ attachment: buffer, name: `${channel.name}-transcript.txt` }]
                    });
                }catch{
                    console.log(`[ticket] could not DM transcript to customer ${ticket.user} (DMs likely closed)`);
                }
            }

            if(CONFIG.TRANSCRIPT_CHANNEL_ID){
                const logChannel = await interaction.guild.channels.fetch(CONFIG.TRANSCRIPT_CHANNEL_ID).catch(() => null);
                if(logChannel){
                    await logChannel.send({
                        content: `📄 Transcript for **#${channel.name}** (closed by ${interaction.user})`,
                        files: [file]
                    }).catch(err => console.log(`[ticket] could not post transcript to log channel: ${err.message}`));
                }else{
                    console.log("[ticket] TRANSCRIPT_CHANNEL_ID set but channel not found");
                }
            }else{
                console.log("[ticket] TRANSCRIPT_CHANNEL_ID not set - transcript generated but not saved anywhere");
            }

        }catch(err){
            console.log(`[ticket] could not generate transcript: ${err.message}`);
        }

        // Critical: this callback runs completely outside the interaction's
        // try/catch (it fires 5 seconds later, on its own timer), so ANY
        // uncaught error in here crashes the whole bot process, not just
        // this command. Never let anything here throw unguarded.
        setTimeout(() => {
            try{
                if(channel && typeof channel.delete === "function"){
                    channel.delete().catch(err => console.log(`[ticket] could not delete channel: ${err.message}`));
                }else{
                    console.log("[ticket] ⚠️ channel reference was missing when trying to delete - skipping");
                }
            }catch(err){
                console.log(`[ticket] ⚠️ unexpected error deleting channel: ${err.message}`);
            }
        }, 5000);
    },

    // -- SMS buttons ----------------------------------------------------------
    async sms_buy(interaction){

        const session = smsSessions.get(interaction.user.id);
        if(!session || !session.provider || !session.service || !session.country){
            return interaction.reply({ content: "❌ Session expired, run `/getnumber` again.", ephemeral: true });
        }

        const cooldownLeft = numberCooldowns.get(interaction.user.id);
        if(cooldownLeft && Date.now() - cooldownLeft < CONFIG.NUMBER_COOLDOWN_MS){
            const secondsLeft = Math.ceil((CONFIG.NUMBER_COOLDOWN_MS - (Date.now() - cooldownLeft)) / 1000);
            return interaction.reply({ content: `⏳ Please wait ${secondsLeft}s before buying another number.`, ephemeral: true });
        }

        await interaction.deferUpdate();

        const slug = countrySlug(session.country, session.provider);
        let purchase;

        try{
            purchase = session.provider === "5sim"
                ? await providers.fivesimBuy(slug, session.service)
                : await providers.smspoolBuy(slug, session.service);
        }catch(err){
            return interaction.editReply({ content: `❌ Purchase failed: ${err.message}`, embeds: [], components: [] });
        }

        const numbers = numbersDB.read();
        const orderId = "SN-" + String(numbers.counter).padStart(4, "0");
        numbers.orders.push({
            id: orderId,
            buyer: interaction.user.id,
            provider: session.provider,
            service: session.service,
            country: session.country,
            phone: purchase.phone,
            providerOrderId: purchase.orderId,
            status: "pending",
            code: null,
            created: new Date().toISOString()
        });
        numbers.counter++;
        numbersDB.write(numbers);

        session.providerOrderId = purchase.orderId;
        session.localOrderId = orderId;
        smsSessions.set(interaction.user.id, session);
        numberCooldowns.set(interaction.user.id, Date.now());

        const embed = brandEmbed({
            title: "✅ Number Ready",
            fields: [
                { name: "☎️ Number", value: `${purchase.phone}` },
                { name: "🧾 Order", value: `${orderId}` }
            ]
        });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("sms_check").setLabel("📩 Check SMS").setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId("sms_resend").setLabel("🔁 Resend/Retry").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId("sms_cancel").setLabel("🚫 Cancel & Refund").setStyle(ButtonStyle.Danger)
        );

        await interaction.editReply({ embeds: [embed], components: [row] });
    },

    async sms_check(interaction){
        const session = smsSessions.get(interaction.user.id);
        if(!session || !session.providerOrderId){
            return interaction.reply({ content: "❌ No active order.", ephemeral: true });
        }
        await interaction.deferReply({ ephemeral: true });

        const result = session.provider === "5sim"
            ? await providers.fivesimCheck(session.providerOrderId)
            : await providers.smspoolCheck(session.providerOrderId);

        if(session.localOrderId){
            const numbers = numbersDB.read();
            const order = numbers.orders.find(o => o.id === session.localOrderId);
            if(order){
                order.status = result.code ? "received" : order.status;
                order.code = result.code || order.code;
                numbersDB.write(numbers);
            }
        }

        await interaction.editReply({
            content: result.code
                ? `📩 Code: \`${result.code}\` (status: ${result.status})`
                : `⏳ No code yet (status: ${result.status})`
        });
    },

    async sms_resend(interaction){
        const session = smsSessions.get(interaction.user.id);
        if(!session || !session.providerOrderId){
            return interaction.reply({ content: "❌ No active order.", ephemeral: true });
        }
        await interaction.deferReply({ ephemeral: true });

        if(session.provider === "smspool"){
            await providers.smspoolResend(session.providerOrderId);
            await interaction.editReply({ content: "🔁 Requested a fresh code from SMSPool." });
        }else{
            await interaction.editReply({
                content: "ℹ️ 5sim has no resend endpoint — trigger a new SMS from the target site using the same number, then Check SMS again."
            });
        }
    },

    async sms_cancel(interaction){
        const session = smsSessions.get(interaction.user.id);
        if(!session || !session.providerOrderId){
            return interaction.reply({ content: "❌ No active order.", ephemeral: true });
        }
        await interaction.deferReply({ ephemeral: true });

        if(session.provider === "5sim"){
            await providers.fivesimCancel(session.providerOrderId);
        }else{
            await providers.smspoolCancel(session.providerOrderId);
        }

        if(session.localOrderId){
            const numbers = numbersDB.read();
            const order = numbers.orders.find(o => o.id === session.localOrderId);
            if(order) order.status = "canceled";
            numbersDB.write(numbers);
        }

        smsSessions.delete(interaction.user.id);
        await interaction.editReply({ content: "🚫 Cancel/refund requested." });
    },

    // -- Quick-question buttons on /support (mirrors the website widget) -----
    async ai_q_ranked(interaction){
        await interaction.deferReply({ ephemeral: true });
        const answer = await askAI("How does rank boosting work?");
        await interaction.editReply({ content: `🤖 ${answer}` });
    },
    async ai_q_sms(interaction){
        await interaction.deferReply({ ephemeral: true });
        const answer = await askAI("What if my SMS code doesn't work?");
        await interaction.editReply({ content: `🤖 ${answer}` });
    },
    async ai_q_camo(interaction){
        await interaction.deferReply({ ephemeral: true });
        const answer = await askAI("How much for a Gold camo?");
        await interaction.editReply({ content: `🤖 ${answer}` });
    },
    async ai_q_safe(interaction){
        await interaction.deferReply({ ephemeral: true });
        const answer = await askAI("Is my account safe when I use your services?");
        await interaction.editReply({ content: `🤖 ${answer}` });
    },

    // -- Purchase buttons from /championsquest and /rankboost - both open a
    // real ticket, same as picking the option from the /ticketpanel dropdown.
    async buy_nuke(interaction){
        await createTicketFor(interaction, "nuke");
    },
    async buy_rankboost(interaction){
        await createTicketFor(interaction, "wz_ranked");
    },
    async buy_camo(interaction){
        await createTicketFor(interaction, "camos");
    },

    async buy_endgame(interaction){
        await createTicketFor(interaction, "endgame");
    },
    async buy_middleman(interaction){
        await createTicketFor(interaction, "middleman");
    },
    async buy_pyroclast(interaction){
        await createTicketFor(interaction, "pyroclast");
    },

    // -- One-time welcome discount spin (from the join message) --------------
    async welcome_spin(interaction){

        const users = usersDB.read();
        const record = users[interaction.user.id] || { vouches: 0 };

        if(record.hasSpunWelcome){
            return interaction.reply({ content: "❌ You've already used your welcome spin!", ephemeral: true });
        }

        const roll = Math.random() * 100;
        let percent, emoji;
        if(roll < 5){ percent = 25; emoji = "🌟"; }
        else if(roll < 25){ percent = 15; emoji = "💜"; }
        else if(roll < 60){ percent = 10; emoji = "🔷"; }
        else{ percent = 5; emoji = "⚪"; }

        const code = `WELCOME-${interaction.user.username.slice(0, 4).toUpperCase()}${Math.floor(1000 + Math.random() * 9000)}`;
        const discounts = discountsDB.read();
        discounts[code] = { percent, usesLeft: 1, createdBy: "welcome_spin" };
        discountsDB.write(discounts);

        record.hasSpunWelcome = true;
        users[interaction.user.id] = record;
        usersDB.write(users);

        const embed = brandEmbed({
            title: `${emoji} You Won ${percent}% Off!`,
            description: `Welcome to **${CONFIG.BRAND_NAME}**! Your code: \`${code}\`\nUse \`/redeem\` to claim it on your first order.`
        });

        await interaction.reply({ embeds: [embed], ephemeral: true });

    },
    // -- Any panel built with /custompanel (customId is "buy_custom_<slug>",
    // bot.js routes these here via prefix match) --
    async buy_custom(interaction){
        const slug = interaction.customId.replace("buy_custom_", "");

        // Prefer reading the title straight off the panel message itself -
        // this survives Railway redeploys, unlike the JSON data file, which
        // gets wiped every time the container rebuilds (ephemeral storage).
        const embedTitle = interaction.message?.embeds?.[0]?.title;
        const panels = custompanelsDB.read();
        const title = embedTitle || panels[slug]?.title;

        if(!title){
            return interaction.reply({ content: "❌ Couldn't read this panel's info - ask staff to recreate it with `/custompanel`.", ephemeral: true });
        }

        await createTicketFor(interaction, slug, title);
    },

    // -- Account listing flow: button opens the details/price modal ---------
    async sell_account_start(interaction){
        const modal = new ModalBuilder()
            .setCustomId("account_listing_form")
            .setTitle("Sell Your Account");

        const titleInput = new TextInputBuilder()
            .setCustomId("account_title")
            .setLabel("Account Title (e.g. platform, level)")
            .setStyle(TextInputStyle.Short)
            .setMaxLength(100)
            .setRequired(true);

        const descInput = new TextInputBuilder()
            .setCustomId("account_description")
            .setLabel("Description (skins, camos, rank, etc.)")
            .setStyle(TextInputStyle.Paragraph)
            .setMaxLength(1000)
            .setRequired(true);

        const priceInput = new TextInputBuilder()
            .setCustomId("account_price")
            .setLabel("Price")
            .setStyle(TextInputStyle.Short)
            .setMaxLength(50)
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(titleInput),
            new ActionRowBuilder().addComponents(descInput),
            new ActionRowBuilder().addComponents(priceInput)
        );

        await interaction.showModal(modal);
    },

    // -- Food order: opens a private ticket and posts the CashApp payment
    // card with a scannable QR code inside it. --------------------------------
    async foodorder_start(interaction){

        const existing = interaction.guild.channels.cache.find(
            c => c.name === `food-${interaction.user.username}`.toLowerCase()
        );
        if(existing){
            return interaction.reply({ content: `❌ You already have a food order in progress: ${existing}`, ephemeral: true });
        }

        let channel;
        try{
            channel = await interaction.guild.channels.create({
                name: `food-${interaction.user.username}`.toLowerCase(),
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                    { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
                    { id: interaction.client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ReadMessageHistory] },
                    { id: CONFIG.TICKET_STAFF_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }
                ]
            });
        }catch(err){
            console.log(`[foodorder] ❌ could not create ticket channel: ${err.message}`);
            return interaction.reply({
                content: `❌ Couldn't create your food order ticket (\`${err.message}\`). Ask staff to check the bot's Manage Channels/Manage Roles permission.`,
                ephemeral: true
            });
        }

        await interaction.reply({ content: `✅ Head to ${channel} to place your order!`, ephemeral: true });

        const { embed: paymentEmbed, row: paymentButtons } = buildCashAppPaymentCard();
        const paymentRow = new ActionRowBuilder().addComponents(
            ...paymentButtons.components,
            new ButtonBuilder().setCustomId("close_ticket").setLabel("🔒 Close").setStyle(ButtonStyle.Danger)
        );

        await channel.send({
            content: `${interaction.user}`,
            embeds: [paymentEmbed],
            components: [paymentRow]
        }).catch(err => console.log(`[foodorder] could not post payment card: ${err.message}`));

        const log = ticketLogDB.read();
        log.open.push({
            channelId: channel.id, user: interaction.user.id, service: "food-order",
            created: new Date().toISOString(), status: "pending", claimedBy: null, closedBy: null, paymentConfirmed: false
        });
        ticketLogDB.write(log);

    },

    // -- Booster application review (customId includes the app ID, e.g.
    // "app_accept_APP-0001" - bot.js routes these here via prefix match) --
    async app_accept(interaction){
        await reviewApplication(interaction, "accepted");
    },
    async app_deny(interaction){
        await reviewApplication(interaction, "denied");
    }

};

async function reviewApplication(interaction, decision){

    if(!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)){
        return interaction.reply({ content: "❌ Only staff can review applications.", ephemeral: true });
    }

    const appId = interaction.customId.replace(/^app_(accept|deny)_/, "");
    const apps = applicationsDB.read();
    const application = apps.entries.find(a => a.id === appId);

    if(!application){
        return interaction.reply({ content: "❌ Application not found (may have already been reviewed).", ephemeral: true });
    }

    application.status = decision;
    application.reviewedBy = interaction.user.id;
    applicationsDB.write(apps);

    const emoji = decision === "accepted" ? "✅" : "❌";
    await interaction.reply({ content: `${emoji} Application ${appId} marked as **${decision}** by ${interaction.user}.` });

    const applicant = await interaction.guild.members.fetch(application.user).catch(() => null);
    if(applicant){
        await applicant.send(
            decision === "accepted"
                ? `🎉 Your booster application for **${CONFIG.BRAND_NAME}** was accepted! Staff will reach out with next steps.`
                : `Your booster application for **${CONFIG.BRAND_NAME}** wasn't accepted this time. Feel free to apply again in the future.`
        ).catch(() => {}); // ignore if DMs are closed
    }

}

// ---------------------------------------------------------------------------
// SELECT MENU HANDLERS
// ---------------------------------------------------------------------------

// Shared ticket-creation logic - used by the ticket_select dropdown AND by
// direct "Purchase" buttons like /championsquest and /rankboost, so both
// paths create the exact same kind of ticket channel.
async function handleVouchRating(interaction, rating){

    vouchSessions.set(interaction.channel.id, { userId: interaction.user.id, rating });

    await interaction.update({
        embeds: [
            new EmbedBuilder()
                .setColor("#FFD700")
                .setTitle("💬 Step 2 of 3 — Tell Us About It")
                .setDescription(`You picked ${"⭐".repeat(rating)}. Now type your review as a message in this channel.`)
                .setFooter({ text: CONFIG.BRAND_NAME })
        ],
        components: []
    });

    let collected;
    try{
        collected = await interaction.channel.awaitMessages({
            filter: m => m.author.id === interaction.user.id && m.content.trim().length > 0,
            max: 1,
            time: 5 * 60 * 1000,
            errors: ["time"]
        });
    }catch{
        await interaction.channel.send({ content: "⌛ Timed out waiting for your review. This channel will delete in 10 seconds - use `/panel`'s button to try again." }).catch(() => {});
        vouchSessions.delete(interaction.channel.id);
        setTimeout(() => interaction.channel.delete().catch(() => {}), 10000);
        return;
    }

    const comment = collected.first().content.trim();
    const session = vouchSessions.get(interaction.channel.id);
    session.comment = comment;
    vouchSessions.set(interaction.channel.id, session);

    const photoRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("vouch_photo_yes").setLabel("Upload a Picture").setEmoji("📸").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("vouch_photo_skip").setLabel("Skip").setEmoji("⏭️").setStyle(ButtonStyle.Secondary)
    );

    await interaction.channel.send({
        embeds: [
            new EmbedBuilder()
                .setColor("#FFD700")
                .setTitle("📸 Step 3 of 3 — Add a Screenshot?")
                .setDescription("Optional! Want to attach proof/a screenshot to your vouch?")
                .setFooter({ text: CONFIG.BRAND_NAME })
        ],
        components: [photoRow]
    }).catch(() => {});

}

async function finalizeVouch(interaction, session, imageUrl){

    vouchSessions.delete(interaction.channel.id);

    const channel = await interaction.guild.channels.fetch(CONFIG.VOUCH_CHANNEL_ID).catch(() => null);

    if(!channel){
        await interaction.channel.send({ content: "❌ Couldn't find the vouch channel - contact staff to check `VOUCH_CHANNEL_ID`. This channel will delete in 15 seconds." }).catch(() => {});
        setTimeout(() => interaction.channel.delete().catch(() => {}), 15000);
        return;
    }

    const stats = vouchesDB.read();
    stats.entries.push({ user: session.userId, comment: session.comment, at: new Date().toISOString() });
    stats.totalVouches++;
    stats.ratingSum = (stats.ratingSum || 0) + session.rating;
    vouchesDB.write(stats);

    const users = usersDB.read();
    users[session.userId] = users[session.userId] || { vouches: 0 };
    users[session.userId].vouches++;
    usersDB.write(users);

    const embed = buildVouchResultEmbed({
        user: interaction.user,
        rating: session.rating,
        comment: session.comment,
        totalVouches: stats.totalVouches
    });

    // Download + re-upload the image so it doesn't break once this private
    // channel (and the message that originally hosted it) gets deleted.
    let file = null;
    if(imageUrl){
        try{
            const res = await fetch(imageUrl);
            if(res.ok){
                const buffer = Buffer.from(await res.arrayBuffer());
                const extMatch = imageUrl.match(/\.(png|jpe?g|gif|webp)(\?.*)?$/i);
                const ext = extMatch ? extMatch[1].toLowerCase() : "png";
                const filename = `vouch-proof.${ext}`;
                file = { attachment: buffer, name: filename };
                embed.setImage(`attachment://${filename}`);
            }else{
                embed.setImage(imageUrl);
            }
        }catch(err){
            console.log(`[vouch] ⚠️ could not re-upload image, using original URL: ${err.message}`);
            embed.setImage(imageUrl);
        }
    }

    const sendPayload = { embeds: [embed] };
    if(file) sendPayload.files = [file];

    try{
        await channel.send(sendPayload);
        await interaction.channel.send({ content: "✅ Your vouch is posted! This channel will delete in 10 seconds. Thank you! 🎉" }).catch(() => {});
    }catch(err){
        console.log(`[vouch] ❌ could not post vouch: ${err.message}`);
        await interaction.channel.send({ content: `❌ Couldn't post your vouch (\`${err.message}\`). This channel will delete in 15 seconds.` }).catch(() => {});
        setTimeout(() => interaction.channel.delete().catch(() => {}), 15000);
        return;
    }

    setTimeout(() => interaction.channel.delete().catch(() => {}), 10000);

}

async function handleVerifyPick(interaction, pickedIndex){

    const session = verifySessions.get(interaction.user.id);

    if(!session || Date.now() > session.expires){
        verifySessions.delete(interaction.user.id);
        const retryRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("verify_start").setLabel("Try Again").setEmoji("🔁").setStyle(ButtonStyle.Success)
        );
        return interaction.update({
            embeds: [brandEmbed({ title: "⌛ Challenge Expired", description: "That verification challenge timed out. Click below to get a new one.", color: "#F6821F", thumbnail: false })],
            components: [retryRow]
        }).catch(() => interaction.reply({ content: "⌛ That challenge expired - click **Start Verification** again.", ephemeral: true }));
    }

    verifySessions.delete(interaction.user.id);

    if(pickedIndex !== session.correctIndex){
        const retryRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("verify_start").setLabel("Try Again").setEmoji("🔁").setStyle(ButtonStyle.Success)
        );
        return interaction.update({
            embeds: [brandEmbed({ title: "❌ That Wasn't a Match", description: "Verification failed - that wasn't the right emoji. Give it another shot.", color: "#FF0000", thumbnail: false })],
            components: [retryRow]
        });
    }

    try{
        await interaction.member.roles.add(CONFIG.VERIFIED_ROLE_ID);
    }catch(err){
        console.log(`[verify] ❌ could not add verified role: ${err.message}`);
        return interaction.update({
            embeds: [brandEmbed({ title: "❌ Verification Error", description: `Couldn't grant your role (\`${err.message}\`). This usually means the bot's role needs **Manage Roles**, or sits below the verified role - ask staff to check.`, color: "#FF0000", thumbnail: false })],
            components: []
        });
    }

    const successEmbed = brandEmbed({
        title: "✅ Verification Complete",
        color: "#43B581",
        thumbnail: false,
        description:
            `🎉 **You're verified!** Welcome to **${CONFIG.BRAND_NAME}**.\n\n` +
            `🔓 Full server access unlocked\n` +
            `🛡️ Protected by Cloudflare-style Turnstile filtering\n` +
            `⚡ Session secured`
    });

    await interaction.update({ embeds: [successEmbed], components: [] });

    await securityLog(interaction.guild, {
        title: "✅ Member Verified (2-Step)",
        description: `**User:** ${interaction.user} (${interaction.user.id})`,
        color: "#00FF00"
    });

}

async function updateOrderStatus(interaction, stage, title, description){

    if(!isTicketStaff(interaction.member)){
        return interaction.reply({ content: "❌ Only staff can update order progress.", ephemeral: true });
    }

    const log = ticketLogDB.read();
    const ticket = log.open.find(t => t.channelId === interaction.channel.id);
    if(ticket){
        ticket.orderStage = stage;
        ticketLogDB.write(log);
    }

    const embed = brandEmbed({ title, description });

    await interaction.reply({ embeds: [embed] });

    if(stage === "completed" && ticket){
        const websiteBtn = websiteRow();
        await interaction.channel.send({
            content: `${ticket.user ? `<@${ticket.user}>` : ""} 🎉 Don't forget to leave a vouch for this order!`,
            components: websiteBtn ? [websiteBtn] : []
        }).catch(() => {});
    }

}

async function createTicketFor(interaction, choice, customLabel = null){

    const cooldownLeft = ticketCooldowns.get(interaction.user.id);
    if(cooldownLeft && Date.now() - cooldownLeft < CONFIG.TICKET_COOLDOWN_MS){
        const secondsLeft = Math.ceil((CONFIG.TICKET_COOLDOWN_MS - (Date.now() - cooldownLeft)) / 1000);
        return interaction.reply({ content: `⏳ Please wait ${secondsLeft}s before opening another ticket.`, ephemeral: true });
    }

    const service = customLabel ? { label: customLabel, emoji: "🎯" } : CONFIG.TICKET_SERVICES.find(s => s.value === choice);

    const existing = interaction.guild.channels.cache.find(
        c => c.name === `ticket-${interaction.user.username}`.toLowerCase()
    );
    if(existing){
        return interaction.reply({ content: "❌ You already have an open ticket.", ephemeral: true });
    }

    const orderCounter = ordersDB.read();
    const orderId = `ORD-${orderCounter.counter}`;
    orderCounter.counter++;
    ordersDB.write(orderCounter);

    let channel;
    try{
        channel = await interaction.guild.channels.create({
            name: `ticket-${interaction.user.username}`.toLowerCase(),
            type: ChannelType.GuildText,
            permissionOverwrites: [
                { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
                { id: interaction.client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageRoles, PermissionFlagsBits.ReadMessageHistory] }
            ]
        });
    }catch(err){
        console.log(`[ticket] ❌ could not create ticket channel: ${err.message}`);
        return interaction.reply({
            content: `❌ Couldn't create your ticket (\`${err.message}\`). This almost always means the bot's role is missing **Manage Channels** / **Manage Roles**, or its role sits below a role it's trying to set permissions for. Ask a staff member to check the bot's role permissions.`,
            ephemeral: true
        });
    }

    const embed = brandEmbed({
        title: "🎫 Order Setup",
        fields: [
            { name: "🆔 Order ID", value: `\`${orderId}\`` },
            { name: "👤 Customer", value: `${interaction.user}` },
            { name: "🎯 Service", value: `${typeof service.emoji === "string" ? service.emoji : "<:e:" + service.emoji.id + ">"} ${service.label}` }
        ],
        description: `A staff member will help finalize your order shortly.\nCustomer can check status anytime with \`/trackorder ${orderId}\`.`
    });

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("claim_ticket").setLabel("🙋 Claim").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("close_ticket").setLabel("🔒 Close").setStyle(ButtonStyle.Danger)
    );

    const progressRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("order_started").setLabel("🟡 Started").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("order_halfway").setLabel("🟠 Halfway Done").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("order_complete").setLabel("✅ Complete").setStyle(ButtonStyle.Success)
    );

    try{
        await channel.send({ content: `${interaction.user}`, embeds: [embed], components: [row, progressRow] });
    }catch(err){
        console.log(`[ticket] ❌ channel created but could not send embed: ${err.message}`);
        return interaction.reply({
            content: `⚠️ Ticket channel ${channel} was created, but I couldn't post in it (\`${err.message}\`). Check that the bot's role has **Send Messages** and **Embed Links** permissions.`,
            ephemeral: true
        });
    }

    // Post the CashApp payment card right after ticket setup so the
    // customer can pay and scan the QR immediately, no extra steps.
    const { embed: paymentEmbed, row: paymentButtons } = buildCashAppPaymentCard();
    await channel.send({ embeds: [paymentEmbed], components: [paymentButtons] }).catch(err =>
        console.log(`[ticket] ⚠️ could not post payment card: ${err.message}`)
    );

    const log = ticketLogDB.read();
    log.open.push({
        channelId: channel.id, user: interaction.user.id, service: choice, orderId,
        created: new Date().toISOString(), status: "pending", claimedBy: null, closedBy: null, paymentConfirmed: false
    });
    ticketLogDB.write(log);

    ticketCooldowns.set(interaction.user.id, Date.now());

    // If they picked Number Rental, connect straight into the SMS flow
    // inside this ticket instead of making them run /getnumber separately.
    if(choice === "number_rental"){

        smsSessions.set(interaction.user.id, {});

        const smsEmbed = brandEmbed({
            title: "📱 Number Rental",
            description: "Pick a provider to get started - staff can help if you get stuck."
        });

        const smsMenu = new StringSelectMenuBuilder()
            .setCustomId("sms_provider_select")
            .setPlaceholder("Choose a provider...")
            .addOptions(
                { label: "5sim", value: "5sim", emoji: "5️⃣" },
                { label: "SMSPool", value: "smspool", emoji: "🌀" }
            );

        await channel.send({
            embeds: [smsEmbed],
            components: [new ActionRowBuilder().addComponents(smsMenu)]
        }).catch(err => console.log(`[ticket] could not post SMS flow in ticket: ${err.message}`));

    }

    await interaction.reply({ content: `✅ Ticket created: ${channel}`, ephemeral: true });

}

const selectHandlers = {

    async rankcalc_current(interaction){
        const emojis = await fetchGuildEmojis(interaction.guild);
        const arrow = emojiTag(emojis, RANK_ARROW_EMOJI_ID, "→");
        const currentIndex = parseInt(interaction.values[0]);

        await interaction.update({
            embeds: [buildRankResultEmbed(arrow, currentIndex, null)],
            components: buildRankComponents(emojis, currentIndex, null)
        });
    },

    async rankcalc_desired(interaction){
        if(interaction.values[0] === "none") return;

        // The current rank was encoded into this exact select's customId
        // when it was built (e.g. "rankcalc_desired_5") - no stored state
        // needed, which is what makes this survive bot restarts.
        const currentIndex = parseInt(interaction.customId.replace("rankcalc_desired_", ""));
        const desiredIndex = parseInt(interaction.values[0]);

        const emojis = await fetchGuildEmojis(interaction.guild);
        const arrow = emojiTag(emojis, RANK_ARROW_EMOJI_ID, "→");

        await interaction.update({
            embeds: [buildRankResultEmbed(arrow, currentIndex, desiredIndex)],
            components: buildRankComponents(emojis, currentIndex, desiredIndex)
        });
    },

    async ticket_select(interaction){
        await createTicketFor(interaction, interaction.values[0]);
    },

    // -- THRILLER.exe product dropdown (customId is "thriller_select_<panelId>",
    // bot.js routes these here via prefix match) --
    async thriller_select(interaction){
        const value = interaction.values[0];

        // Read the picked option's label straight from the select menu that's
        // still attached to this message - survives redeploys, unlike the
        // JSON data file (Railway wipes local files on every rebuild).
        const selectMenu = interaction.message?.components
            ?.flatMap(row => row.components)
            ?.find(c => c.customId === interaction.customId);
        const chosenOption = selectMenu?.options?.find(o => o.value === value);

        let label = chosenOption?.label;

        if(!label){
            const panelId = interaction.customId.replace("thriller_select_", "");
            const panels = thrillerPanelsDB.read();
            label = panels[panelId]?.products?.find(p => p.value === value)?.label;
        }

        if(!label){
            return interaction.reply({ content: "❌ Couldn't read this product's info - ask staff to recreate it with `/thrillerpanel`.", ephemeral: true });
        }

        await createTicketFor(interaction, value, label);
    },

    async sms_provider_select(interaction){
        smsSessions.set(interaction.user.id, { provider: interaction.values[0] });

        const embed = brandEmbed({
            title: "📱 Number Rental",
            fields: [{ name: "Provider", value: interaction.values[0] }],
            description: "Now pick a service:"
        });

        const menu = new StringSelectMenuBuilder()
            .setCustomId("sms_service_select")
            .setPlaceholder("Choose a service...")
            .addOptions(CONFIG.SMS_SERVICES.map(s => ({ label: s.label, value: s.value })));

        await interaction.update({ embeds: [embed], components: [new ActionRowBuilder().addComponents(menu)] });
    },

    async sms_service_select(interaction){
        const session = smsSessions.get(interaction.user.id) || {};
        session.service = interaction.values[0];
        smsSessions.set(interaction.user.id, session);

        const embed = brandEmbed({
            title: "📱 Number Rental",
            fields: [
                { name: "Provider", value: session.provider },
                { name: "Service", value: session.service }
            ],
            description: "Now pick a region:"
        });

        const menu = new StringSelectMenuBuilder()
            .setCustomId("sms_country_select")
            .setPlaceholder("Choose a region...")
            .addOptions(CONFIG.SMS_COUNTRIES.map(c => ({ label: c.label, value: c.value })));

        await interaction.update({ embeds: [embed], components: [new ActionRowBuilder().addComponents(menu)] });
    },

    async sms_country_select(interaction){
        const session = smsSessions.get(interaction.user.id) || {};
        session.country = interaction.values[0];
        smsSessions.set(interaction.user.id, session);

        const embed = brandEmbed({
            title: "📱 Number Rental",
            fields: [
                { name: "Provider", value: session.provider },
                { name: "Service", value: session.service },
                { name: "Region", value: session.country }
            ],
            description: "Ready to buy."
        });

        const buy = new ButtonBuilder().setCustomId("sms_buy").setLabel("💳 Buy Number").setStyle(ButtonStyle.Success);

        await interaction.update({ embeds: [embed], components: [new ActionRowBuilder().addComponents(buy)] });
    },

    async faq_select(interaction){
        const faq = FAQ_CATALOG.find(f => f.value === interaction.values[0]);

        const embed = brandEmbed({
            title: "❓ FAQ Answer",
            description: faq?.answer || "No answer found for that topic - please open a ticket instead."
        });

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }

};

// ---------------------------------------------------------------------------
// MODAL HANDLERS
// ---------------------------------------------------------------------------

const modalHandlers = {

    // -- Step 2 of /custompanel: text fields are in, now ask for the image --
    async custompanel_form(interaction){

        const title = interaction.fields.getTextInputValue("cp_title");
        const slug = interaction.fields.getTextInputValue("cp_slug").trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9_-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "");
        const price = interaction.fields.getTextInputValue("cp_price");
        const features = interaction.fields.getTextInputValue("cp_features").split("\n").map(f => f.trim()).filter(Boolean);
        const buttonLabel = interaction.fields.getTextInputValue("cp_button_label") || "Open Ticket";

        if(!slug){
            return interaction.reply({ content: "❌ That slug isn't valid - use letters, numbers, dashes or underscores only. Run `/custompanel` again.", ephemeral: true });
        }

        await interaction.reply({
            content: "📸 Last step! Upload an image for the bottom of the panel right here (as an attachment), or type `skip` to leave it blank. You have 3 minutes.",
            ephemeral: true
        });

        let collected;
        try{
            collected = await interaction.channel.awaitMessages({
                filter: m => m.author.id === interaction.user.id,
                max: 1,
                time: 3 * 60 * 1000,
                errors: ["time"]
            });
        }catch{
            return interaction.followUp({ content: "⌛ Timed out waiting for an image. Run `/custompanel` again when you're ready.", ephemeral: true });
        }

        const reply = collected.first();
        const attachment = reply?.attachments.find(a =>
            (a.contentType && a.contentType.startsWith("image/")) || /\.(png|jpe?g|webp|gif)$/i.test(a.url)
        );
        const skipped = reply?.content.trim().toLowerCase() === "skip";

        if(!attachment && !skipped){
            return interaction.followUp({ content: "❌ That wasn't an image or `skip`. Run `/custompanel` again.", ephemeral: true });
        }

        const panels = custompanelsDB.read();
        panels[slug] = { title, buttonLabel };
        custompanelsDB.write(panels);

        const embed = brandEmbed({
            title,
            thumbnail: false,
            description:
                features.map(f => `🟢 ${f}`).join("\n") +
                `\n\n💷 PRICE ➤ **${price}**\n\n` +
                "🕐 SAME DAY STARTING TIME!\n" +
                "🔥 DISCOUNTED IF YOU HAVE PROGRESS!"
        }).setFooter({ text: `${CONFIG.BRAND_NAME}'s Services` });

        const files = [];
        if(attachment){
            embed.setImage(`attachment://${attachment.name}`);
            files.push(attachment.url);
        }

        const button = new ButtonBuilder()
            .setCustomId(`buy_custom_${slug}`)
            .setLabel(buttonLabel)
            .setEmoji("🔵")
            .setStyle(ButtonStyle.Primary);

        try{
            await interaction.channel.send({
                embeds: [embed],
                files,
                components: [new ActionRowBuilder().addComponents(button)]
            });
            await interaction.followUp({ content: "✅ Panel posted!", ephemeral: true });
        }catch(err){
            await interaction.followUp({ content: `❌ Couldn't post the panel (\`${err.message}\`).`, ephemeral: true });
        }

    },

    // -- Same as custompanel_form, but asks for + attaches a VIDEO instead
    // of a picture. Embeds can't render video, so the clip is sent as a
    // normal message attachment alongside the embed - Discord auto-plays it. --
    async custompanelvideo_form(interaction){

        const title = interaction.fields.getTextInputValue("cp_title");
        const slug = interaction.fields.getTextInputValue("cp_slug").trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9_-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "");
        const price = interaction.fields.getTextInputValue("cp_price");
        const features = interaction.fields.getTextInputValue("cp_features").split("\n").map(f => f.trim()).filter(Boolean);
        const buttonLabel = interaction.fields.getTextInputValue("cp_button_label") || "Open Ticket";

        if(!slug){
            return interaction.reply({ content: "❌ That slug isn't valid - use letters, numbers, dashes or underscores only. Run `/custompanelvideo` again.", ephemeral: true });
        }

        await interaction.reply({
            content: "🎥 Last step! Upload a video for the panel right here (as an attachment - mp4/mov/webm work best), or type `skip` to leave it blank. You have 3 minutes.",
            ephemeral: true
        });

        let collected;
        try{
            collected = await interaction.channel.awaitMessages({
                filter: m => m.author.id === interaction.user.id,
                max: 1,
                time: 3 * 60 * 1000,
                errors: ["time"]
            });
        }catch{
            return interaction.followUp({ content: "⌛ Timed out waiting for a video. Run `/custompanelvideo` again when you're ready.", ephemeral: true });
        }

        const reply = collected.first();
        const attachment = reply?.attachments.find(a =>
            (a.contentType && a.contentType.startsWith("video/")) || /\.(mp4|mov|webm|mkv|avi)$/i.test(a.url)
        );
        const skipped = reply?.content.trim().toLowerCase() === "skip";

        if(!attachment && !skipped){
            return interaction.followUp({ content: "❌ That wasn't a video or `skip`. Run `/custompanelvideo` again.", ephemeral: true });
        }

        const panels = custompanelsDB.read();
        panels[slug] = { title, buttonLabel };
        custompanelsDB.write(panels);

        const embed = brandEmbed({
            title,
            thumbnail: false,
            description:
                features.map(f => `🟢 ${f}`).join("\n") +
                `\n\n💷 PRICE ➤ **${price}**\n\n` +
                "🕐 SAME DAY STARTING TIME!\n" +
                "🔥 DISCOUNTED IF YOU HAVE PROGRESS!"
        }).setFooter({ text: `${CONFIG.BRAND_NAME}'s Services` });

        const files = [];
        if(attachment){
            files.push({ attachment: attachment.url, name: attachment.name });
        }

        const button = new ButtonBuilder()
            .setCustomId(`buy_custom_${slug}`)
            .setLabel(buttonLabel)
            .setEmoji("🔵")
            .setStyle(ButtonStyle.Primary);

        try{
            await interaction.channel.send({
                embeds: [embed],
                files,
                components: [new ActionRowBuilder().addComponents(button)]
            });
            await interaction.followUp({ content: "✅ Panel posted!", ephemeral: true });
        }catch(err){
            await interaction.followUp({ content: `❌ Couldn't post the panel (\`${err.message}\`).`, ephemeral: true });
        }

    },

    // -- THRILLER.exe listing panel: builds the embed + product dropdown ----
    async thrillerpanel_form(interaction){

        const title = interaction.fields.getTextInputValue("tp_title");
        const description = interaction.fields.getTextInputValue("tp_description");
        const priceStock = interaction.fields.getTextInputValue("tp_price_stock");
        const productLines = interaction.fields.getTextInputValue("tp_products")
            .split("\n").map(p => p.trim()).filter(Boolean).slice(0, 25);

        const [price, stock] = priceStock.split("|").map(p => p.trim());
        const status = (!stock || /^0$|out/i.test(stock)) ? "OUT OF STOCK" : "AVAILABLE";

        const panelId = `tp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const products = productLines.map(label => ({
            label: label.slice(0, 100),
            value: label.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 90) || `item-${Math.random().toString(36).slice(2, 7)}`
        }));

        thrillerPanelsDB.write({ ...thrillerPanelsDB.read(), [panelId]: { products } });

        const embed = new EmbedBuilder()
            .setColor("#00CFFF")
            .setTitle("═══ THRILLER.exe // LISTING UPDATED ═══")
            .setDescription(
                `**¤ ${title}**\n\n` +
                "```\nTHRILLER.exe // DIGITAL SERVICES\n```\n\n" +
                `${description}\n\n` +
                "▸ **Select a product** from the dropdown below.\n" +
                "▸ Specs, pricing and info shown **privately** in your ticket.\n" +
                "▸ Checkout runs in-ticket · staff confirms payment."
            )
            .addFields(
                { name: "◈ PRICE", value: price || "Contact staff", inline: true },
                { name: "▤ STOCK", value: stock || "Unknown", inline: true },
                { name: "◉ STATUS", value: status, inline: true }
            )
            .setFooter({ text: `THRILLER.exe Operations · ${new Date().getFullYear()}` })
            .setTimestamp();

        const menu = new StringSelectMenuBuilder()
            .setCustomId(`thriller_select_${panelId}`)
            .setPlaceholder(`SELECT A PRODUCT — showing ${products.length} of ${products.length}`)
            .addOptions(products.map(p => ({ label: p.label, value: p.value })));

        await interaction.channel.send({
            embeds: [embed],
            components: [new ActionRowBuilder().addComponents(menu)]
        }).catch(err => {
            console.log(`[thrillerpanel] ❌ could not post panel: ${err.message}`);
        });

        await interaction.reply({ content: "✅ THRILLER.exe panel posted!", ephemeral: true });

    },

    // -- Account listing: after title/description/price, open a private
    // channel just for this listing, collect images there, post the final
    // listing, then delete the private channel so the images/back-and-forth
    // don't pile up permanently in one shared channel.
    async account_listing_form(interaction){

        const title = interaction.fields.getTextInputValue("account_title");
        const description = interaction.fields.getTextInputValue("account_description");
        const price = interaction.fields.getTextInputValue("account_price");

        const existing = interaction.guild.channels.cache.find(
            c => c.name === `sell-${interaction.user.username}`.toLowerCase()
        );
        if(existing){
            return interaction.reply({ content: `❌ You already have a listing in progress: ${existing}`, ephemeral: true });
        }

        let channel;
        try{
            channel = await interaction.guild.channels.create({
                name: `sell-${interaction.user.username}`.toLowerCase(),
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                    { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
                    { id: interaction.client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ReadMessageHistory] }
                ]
            });
        }catch(err){
            console.log(`[sellaccount] ❌ could not create private channel: ${err.message}`);
            return interaction.reply({
                content: `❌ Couldn't set up your private listing channel (\`${err.message}\`). Ask staff to check the bot's Manage Channels/Manage Roles permission.`,
                ephemeral: true
            });
        }

        await interaction.reply({ content: `✅ Head to ${channel} to finish your listing.`, ephemeral: true });

        const promptEmbed = brandEmbed({
            title: "📸 Add Your Screenshots",
            description: "Send **1-5 screenshots** of the account right here (as attachments). Type `done` when finished, or this channel will wrap up automatically after 5 minutes.",
            fields: [
                { name: "🎮 Title", value: title },
                { name: "💰 Price", value: price, inline: true }
            ]
        });

        await channel.send({ content: `${interaction.user}`, embeds: [promptEmbed] }).catch(() => {});

        const imageUrls = [];

        const collector = channel.createMessageCollector({
            filter: m => m.author.id === interaction.user.id,
            time: 5 * 60 * 1000
        });

        collector.on("collect", (m) => {
            if(m.content.trim().toLowerCase() === "done"){
                collector.stop("done");
                return;
            }
            for(const att of m.attachments.values()){
                if((att.contentType && att.contentType.startsWith("image/")) || /\.(png|jpe?g|webp|gif)$/i.test(att.url)){
                    imageUrls.push(att.url);
                }
            }
            if(imageUrls.length >= 5) collector.stop("max");
        });

        collector.on("end", async () => {

            if(imageUrls.length === 0){
                await channel.send({ content: "❌ No images received in time - this listing was cancelled. This channel will delete in 10 seconds." }).catch(() => {});
                setTimeout(() => channel.delete().catch(() => {}), 10000);
                return;
            }

            // Group images into a gallery by sharing the same embed URL -
            // Discord clusters multiple embeds with the same setURL() into
            // one image gallery instead of stacking separate blocks.
            const galleryUrl = "https://discord.com/";

            const mainEmbed = brandEmbed({
                title: `🎮 ${title}`,
                description,
                fields: [
                    { name: "💰 Price", value: price, inline: true },
                    { name: "👤 Seller", value: `${interaction.user}`, inline: true }
                ]
            }).setURL(galleryUrl).setImage(imageUrls[0]);

            const extraEmbeds = imageUrls.slice(1, 5).map(url =>
                new EmbedBuilder().setURL(galleryUrl).setImage(url).setColor(CONFIG.COLOR)
            );

            const postChannel = await interaction.guild.channels.fetch(CONFIG.ACCOUNT_LISTING_POST_CHANNEL_ID).catch(() => null);

            if(!postChannel){
                await channel.send({ content: "❌ Couldn't find the listing channel - contact staff so they can check ACCOUNT_LISTING_POST_CHANNEL_ID. This channel will delete in 15 seconds." }).catch(() => {});
                setTimeout(() => channel.delete().catch(() => {}), 15000);
                return;
            }

            try{
                await postChannel.send({ embeds: [mainEmbed, ...extraEmbeds] });
                await channel.send({ content: `✅ Your listing is up in ${postChannel}! This channel will delete in 10 seconds.` }).catch(() => {});
            }catch(err){
                console.log(`[sellaccount] could not post listing: ${err.message}`);
                await channel.send({ content: `❌ Couldn't post your listing (\`${err.message}\`). This channel will delete in 15 seconds.` }).catch(() => {});
                setTimeout(() => channel.delete().catch(() => {}), 15000);
                return;
            }

            setTimeout(() => channel.delete().catch(() => {}), 10000);

        });

    },

    async apply_form(interaction){

        try{

            const experience = interaction.fields.getTextInputValue("apply_experience");
            const availability = interaction.fields.getTextInputValue("apply_availability");
            const why = interaction.fields.getTextInputValue("apply_why");

            const apps = applicationsDB.read();
            const appId = "APP-" + String(apps.counter).padStart(4, "0");
            apps.entries.push({
                id: appId, user: interaction.user.id, experience, availability, why,
                status: "pending", created: new Date().toISOString()
            });
            apps.counter++;
            applicationsDB.write(apps);

            const embed = brandEmbed({
                title: "📋 New Booster Application",
                fields: [
                    { name: "Applicant", value: `${interaction.user} (${interaction.user.id})` },
                    { name: "Experience", value: experience },
                    { name: "Availability", value: availability },
                    { name: "Why they want to boost", value: why },
                    { name: "Application ID", value: appId }
                ]
            });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`app_accept_${appId}`).setLabel("✅ Accept").setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId(`app_deny_${appId}`).setLabel("❌ Deny").setStyle(ButtonStyle.Danger)
            );

            if(CONFIG.APPLICATION_CHANNEL_ID){
                const channel = await interaction.guild.channels.fetch(CONFIG.APPLICATION_CHANNEL_ID).catch(() => null);
                if(channel){
                    await channel.send({ embeds: [embed], components: [row] });
                }else{
                    console.log("[apply] APPLICATION_CHANNEL_ID set but channel not found");
                }
            }else{
                console.log("[apply] APPLICATION_CHANNEL_ID not set - application saved but not posted anywhere for staff to see");
            }

            await interaction.reply({
                content: "✅ Application submitted! Staff will review it and get back to you.",
                ephemeral: true
            });

        }catch(err){
            console.log(`[apply] ❌ ${err.message}`);
            await interaction.reply({ content: `❌ Something went wrong submitting your application: ${err.message}`, ephemeral: true }).catch(() => {});
        }

    },

    async post_form(interaction){

        try{

            const title = interaction.fields.getTextInputValue("post_title").trim();
            const description = interaction.fields.getTextInputValue("post_description").trim();

            if(!title || !description){
                return interaction.reply({
                    content: "❌ Both a title and description are required.",
                    ephemeral: true
                });
            }

            const divider = "━━━━━━━━━━━━━━━━━━";

            const embed = brandEmbed({
                title: title,
                description: `${divider}\n\n${description}\n\n${divider}`
            });

            await interaction.reply({ embeds: [embed] });

        }catch(err){
            console.log(`[post] ❌ ${err.message}`);
            const errorMsg = { content: `❌ Something went wrong creating that post: ${err.message}`, ephemeral: true };
            if(interaction.replied || interaction.deferred){
                await interaction.followUp(errorMsg).catch(() => {});
            }else{
                await interaction.reply(errorMsg).catch(() => {});
            }
        }

    }

};

// ---------------------------------------------------------------------------
// SECURITY: message-level checks (invite links, mass mention spam)
// ---------------------------------------------------------------------------

const INVITE_REGEX = /(discord\.gg|discord\.com\/invite|discordapp\.com\/invite)\/[a-zA-Z0-9-]+/i;

// Returns true if the message was handled (deleted) - callers should stop
// processing that message further if this returns true.
async function handleSecurityChecks(message){

    if(message.author.bot) return false;
    if(!message.guild) return false;

    const member = message.member;
    const isStaff = member?.permissions.has(PermissionFlagsBits.ManageGuild);

    // -- Invite link filter (staff are exempt) --
    if(!isStaff && INVITE_REGEX.test(message.content)){
        await message.delete().catch(() => {});
        const warning = await message.channel.send({
            content: `${message.author}, posting server invites isn't allowed here.`
        }).catch(() => null);
        if(warning) setTimeout(() => warning.delete().catch(() => {}), 5000);

        await securityLog(message.guild, {
            title: "🔗 Invite Link Blocked",
            description: `**User:** ${message.author} (${message.author.id})\n**Channel:** ${message.channel}\n**Content:** ${message.content.slice(0, 200)}`
        });

        return true;
    }

    // -- Mass mention spam (staff exempt) --
    const mentionCount = message.mentions.users.size + message.mentions.roles.size;
    if(!isStaff && mentionCount > CONFIG.MAX_MENTIONS_PER_MESSAGE){
        await message.delete().catch(() => {});

        await member?.timeout(10 * 60000, "Mass mention spam").catch(err =>
            console.log(`[security] could not timeout mass-mention spammer: ${err.message}`)
        );

        await securityLog(message.guild, {
            title: "📢 Mass Mention Spam Blocked",
            description: `**User:** ${message.author} (${message.author.id})\n**Mentions:** ${mentionCount}\n**Channel:** ${message.channel}\n**Action:** 10 minute timeout applied`
        });

        return true;
    }

    return false;

}

// ---------------------------------------------------------------------------
// SECURITY: anti-nuke - detects rapid channel/role deletion and strips the
// executor's roles before they can do more damage. Uses discord.js's
// guildAuditLogEntryCreate event, which gives real-time audit log data
// including who actually did it - no polling needed.
// ---------------------------------------------------------------------------

async function handleAuditLogEntry(entry, guild){

    if(!CONFIG.ANTI_NUKE_ENABLED) return;

    const dangerousActions = [
        AuditLogEvent.ChannelDelete,
        AuditLogEvent.RoleDelete,
        AuditLogEvent.WebhookCreate
    ];

    if(!dangerousActions.includes(entry.action)) return;

    const executorId = entry.executorId;
    if(!executorId) return;

    // The server owner and the bot itself are exempt
    if(executorId === guild.ownerId) return;
    if(executorId === guild.client.user.id) return;

    const now = Date.now();
    const tracked = deleteTracker.get(executorId);

    if(!tracked || now - tracked.firstAt > CONFIG.ANTI_NUKE_WINDOW_MS){
        deleteTracker.set(executorId, { count: 1, firstAt: now });
        return;
    }

    tracked.count++;

    if(tracked.count >= CONFIG.ANTI_NUKE_THRESHOLD){

        deleteTracker.delete(executorId);

        const member = await guild.members.fetch(executorId).catch(() => null);

        if(member){
            const roleIds = member.roles.cache
                .filter(r => r.id !== guild.id && r.editable)
                .map(r => r.id);

            await member.roles.remove(roleIds, "Anti-nuke: rapid channel/role deletion detected").catch(err =>
                console.log(`[anti-nuke] could not strip roles: ${err.message}`)
            );
        }

        await securityLog(guild, {
            title: "🚨 ANTI-NUKE TRIGGERED",
            description:
                `**User:** <@${executorId}> (${executorId})\n` +
                `**Action:** ${tracked.count}x rapid deletions within ${CONFIG.ANTI_NUKE_WINDOW_MS / 1000}s\n` +
                `**Response:** All manageable roles stripped. Review immediately - this may be a compromised account.`,
            color: "#FF0000"
        });

    }

}

// ---------------------------------------------------------------------------
// WELCOME MESSAGE + AUTOROLE
// ---------------------------------------------------------------------------

// -- Called on a timer from bot.js: posts any scheduled announcements whose
// time has arrived. --------------------------------------------------------
async function checkScheduledPosts(client){

    const schedule = scheduleDB.read();
    let changed = false;

    for(const item of schedule){
        if(item.posted || Date.now() < item.postAt) continue;

        item.posted = true;
        changed = true;

        try{
            const channel = await client.channels.fetch(item.channelId).catch(() => null);
            if(!channel) continue;

            const templates = {
                sale: { title: "🎉 SALE IS LIVE!", color: "#FF1493" },
                restock: { title: "📦 RESTOCKED!", color: "#43B581" },
                downtime: { title: "🛠️ SCHEDULED DOWNTIME", color: "#FFA500" },
                patch: { title: "📋 PATCH NOTES", color: "#3498DB" }
            };
            const template = templates[item.type] || templates.sale;

            const embed = new EmbedBuilder()
                .setColor(template.color)
                .setTitle(template.title)
                .setDescription(item.message)
                .setFooter({ text: CONFIG.BRAND_NAME })
                .setTimestamp();

            await channel.send({ embeds: [embed] });
        }catch(err){
            console.log(`[schedule] ❌ could not post scheduled announcement: ${err.message}`);
        }
    }

    if(changed){
        // Keep the file from growing forever - drop posted items older than 7 days
        const pruned = schedule.filter(item => !item.posted || Date.now() - item.postAt < 7 * 24 * 60 * 60 * 1000);
        scheduleDB.write(pruned);
    }
}

// -- Called on a timer from bot.js: posts a weekly recap if it's Monday and
// we haven't already posted one today. --------------------------------------
let lastRecapDate = null;

async function checkWeeklyRecap(client){

    if(!CONFIG.RECAP_CHANNEL_ID) return;

    const now = new Date();
    const todayKey = now.toISOString().slice(0, 10);
    if(now.getUTCDay() !== 1) return; // Monday only
    if(lastRecapDate === todayKey) return;
    lastRecapDate = todayKey;

    const channel = await client.channels.fetch(CONFIG.RECAP_CHANNEL_ID).catch(() => null);
    if(!channel) return;

    const log = ticketLogDB.read();
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const weekTickets = log.open.filter(t => new Date(t.created).getTime() > oneWeekAgo);
    const closedThisWeek = weekTickets.filter(t => t.closedBy);

    const serviceCounts = {};
    for(const t of weekTickets){
        serviceCounts[t.service] = (serviceCounts[t.service] || 0) + 1;
    }
    const topService = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1])[0];

    const staffCounts = {};
    for(const t of closedThisWeek){
        staffCounts[t.closedBy] = (staffCounts[t.closedBy] || 0) + 1;
    }
    const topStaff = Object.entries(staffCounts).sort((a, b) => b[1] - a[1])[0];

    const stats = vouchesDB.read();
    const weekVouches = stats.entries.filter(e => new Date(e.at).getTime() > oneWeekAgo);
    const biggestVouch = weekVouches[0];

    const embed = new EmbedBuilder()
        .setColor("#FFD700")
        .setTitle(`📊 Weekly Recap — ${CONFIG.BRAND_NAME}`)
        .addFields(
            { name: "🎫 Orders This Week", value: `${weekTickets.length}`, inline: true },
            { name: "✅ Completed", value: `${closedThisWeek.length}`, inline: true },
            { name: "⭐ New Vouches", value: `${weekVouches.length}`, inline: true },
            { name: "🔥 Most Popular Service", value: topService ? `${topService[0]} (${topService[1]} orders)` : "No data", inline: true },
            { name: "🏆 Top Staff", value: topStaff ? `<@${topStaff[0]}> (${topStaff[1]} closed)` : "No data", inline: true }
        )
        .setFooter({ text: "See you next week!" })
        .setTimestamp();

    if(biggestVouch){
        embed.addFields({ name: "💬 Featured Vouch", value: `"${biggestVouch.comment.slice(0, 150)}" — <@${biggestVouch.user}>` });
    }

    await channel.send({ embeds: [embed] }).catch(err => console.log(`[recap] could not post: ${err.message}`));
}

async function handleNewMember(member){

    // -- Security: flag accounts newer than the configured threshold --
    const accountAgeDays = (Date.now() - member.user.createdTimestamp) / (1000 * 60 * 60 * 24);
    if(accountAgeDays < CONFIG.NEW_ACCOUNT_MIN_AGE_DAYS){
        await securityLog(member.guild, {
            title: "🆕 New/Young Account Joined",
            description:
                `**User:** ${member} (${member.id})\n` +
                `**Account age:** ${accountAgeDays.toFixed(1)} days (threshold: ${CONFIG.NEW_ACCOUNT_MIN_AGE_DAYS})\n` +
                `This isn't an automatic ban - just a heads up for staff to keep an eye on this account, common with raid/spam bots.`,
            color: "#FFA500"
        });
    }

    if(CONFIG.AUTOROLE_ID){
        await member.roles.add(CONFIG.AUTOROLE_ID).catch(err =>
            console.log(`[welcome] could not add autorole: ${err.message}`)
        );
    }

    if(CONFIG.WELCOME_CHANNEL_ID){
        const channel = await member.guild.channels.fetch(CONFIG.WELCOME_CHANNEL_ID).catch(() => null);
        if(channel){
            const embed = brandEmbed({
                title: `👋 Welcome to ${CONFIG.BRAND_NAME}!`,
                description: `${member} just joined. Check out <#${CONFIG.LEAVE_VOUCH_CHANNEL_ID || ""}> or open a ticket to get started.`,
                thumbnail: false
            }).setThumbnail(member.user.displayAvatarURL());

            const spinButton = new ButtonBuilder()
                .setCustomId("welcome_spin")
                .setLabel("🎡 Spin for a Welcome Discount!")
                .setEmoji("🎉")
                .setStyle(ButtonStyle.Success);

            await channel.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(spinButton)] }).catch(err =>
                console.log(`[welcome] could not send welcome message: ${err.message}`)
            );
        }
    }

}

async function handleAiSupportMessage(message){

    if(message.author.bot) return;
    if(!CONFIG.AI_SUPPORT_CHANNEL_ID) return;
    if(message.channel.id !== CONFIG.AI_SUPPORT_CHANNEL_ID) return;

    await message.channel.sendTyping().catch(() => {});

    const answer = await askAI(message.content);

    const embed = brandEmbed({
        title: `🤖 ${CONFIG.AI_NAME}`,
        description: answer
    });

    await message.reply({ embeds: [embed] }).catch(err =>
        console.log(`[ai-support] could not reply in support channel: ${err.message}`)
    );

}

module.exports = {
    CONFIG,
    slashCommands,
    buttonHandlers,
    selectHandlers,
    modalHandlers,
    giveawaysDB,
    handleNewMember,
    handleAiSupportMessage,
    handleSecurityChecks,
    handleAuditLogEntry,
    checkScheduledPosts,
    checkWeeklyRecap
};
