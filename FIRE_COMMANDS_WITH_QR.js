// =====================================================================
// PREMIUM BLACK MARKET EMBED TEMPLATES + 10 FIRE COMMANDS WITH PAYMENTS
// ADD ALL OF THIS TO YOUR commands.js BEFORE module.exports
// =====================================================================

// FIRE EMBED TEMPLATES
const EMBEDS = {
    // Premium service card
    serviceCard: (title, description, price, features) => {
        return new EmbedBuilder()
            .setColor("#9D00FF")
            .setTitle(`🔓 ${title}`)
            .setDescription(description)
            .addField("✨ FEATURES", features, false)
            .addField("💰 PRICE", `\`${price}\``, true)
            .addField("⚡ SPEED", "Instant - 24hr guaranteed", true)
            .setFooter({ text: "WEEKENDTHRILLER BLACK MARKET | Click below to purchase" })
            .setTimestamp();
    },

    // Exclusive VIP card
    exclusiveVip: (tier, benefits, price) => {
        return new EmbedBuilder()
            .setColor("#FF00FF")
            .setTitle(`👑 ${tier} EXCLUSIVE ACCESS 👑`)
            .setDescription("```\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nUNDERGROUND VAULT UNLOCKED\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n```")
            .addField("🎁 BENEFITS", benefits, false)
            .addField("💎 PRICING", `\`${price}\``, true)
            .addField("🔐 STATUS", "ACTIVE & VERIFIED", true)
            .setFooter({ text: "ELITE TIER | VIP VERIFIED CUSTOMER" })
            .setTimestamp();
    },

    // Payment confirmation card
    paymentCard: (service, amount, cashapp) => {
        return new EmbedBuilder()
            .setColor("#9D00FF")
            .setTitle("💳 PAYMENT INFORMATION 💳")
            .setDescription("```\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nSECURE TRANSACTION\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n```")
            .addField("🛍️ SERVICE", service, true)
            .addField("💵 AMOUNT", amount, true)
            .addField("💰 CASHAPP", `\`${cashapp}\``, false)
            .addField("⚠️ IMPORTANT", "Send payment → Reply with screenshot → Service starts", false)
            .setFooter({ text: "WEEKENDTHRILLER SECURE PAYMENT" })
            .setTimestamp();
    },

    // Black market showcase
    blackMarketShowcase: () => {
        return new EmbedBuilder()
            .setColor("#9D00FF")
            .setTitle("💀 WEEKENDTHRILLER BLACK MARKET 💀")
            .setDescription(
                "```\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                "           WELCOME TO THE UNDERGROUND VAULT\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                "```\n\n" +
                "🔓 **EXCLUSIVE SERVICES**\n" +
                "└─ Rank Boosts | Cosmetics | Numbers | VIP Pass\n\n" +
                "⚡ **INSTANT DELIVERY**\n" +
                "└─ Expert handlers | 500+ vouches | Secure trades\n\n" +
                "🎯 **100% DISCRETION**\n" +
                "└─ Private tickets | Zero logs | No detection\n\n" +
                "💰 **PAYMENT METHOD**\n" +
                "└─ CashApp: `$EvanJoyner8` | Instant processing"
            )
            .setFooter({ text: "AUTHENTICATION REQUIRED • ADULTS ONLY" })
            .setTimestamp();
    },

    // Premium tier details
    tierDetails: (tierName, rank, perks, discount) => {
        return new EmbedBuilder()
            .setColor("#FF00FF")
            .setTitle(`💎 ${tierName.toUpperCase()} TIER DETAILS 💎`)
            .setDescription(`Rank: ${rank}`)
            .addField("🎁 EXCLUSIVE PERKS", perks, false)
            .addField("💰 DISCOUNT", discount, true)
            .addField("📊 BENEFITS", "Priority support • Early access • Custom deals", true)
            .setFooter({ text: "TIER UP BY PURCHASING • AUTOMATIC UPGRADE" })
            .setTimestamp();
    }
};

// 1. PREMIUM TIER SHOWCASE
const premiumTiers = {
    data: new SlashCommandBuilder()
        .setName("premiumtiers")
        .setDescription("💎 View all premium tier levels & benefits"),
    execute: async (interaction) => {
        const embeds = [
            EMBEDS.tierDetails("BRONZE", "Entry Level", "✅ Standard support\n✅ Access to all services\n✅ Community member", "No discount"),
            EMBEDS.tierDetails("SILVER", "Growing Trust", "✅ Priority support (under 10min)\n✅ 5% off all services\n✅ Early access to promos", "5% off"),
            EMBEDS.tierDetails("GOLD", "Regular Customer", "✅ VIP support (under 5min)\n✅ 10% off all services\n✅ Monthly bonuses", "10% off"),
            EMBEDS.tierDetails("PLATINUM", "Elite Status", "✅ 24/7 dedicated staff\n✅ 15% off all services\n✅ Custom service packages", "15% off"),
            EMBEDS.tierDetails("APEX", "Legendary", "✅ Private seller network\n✅ 20% off everything\n✅ Lifetime guarantee", "20% off"),
            EMBEDS.tierDetails("🔓 BLACK MARKET", "Underground", "✅ No limits policy\n✅ Custom pricing\n✅ Exclusive services", "CUSTOM")
        ];
        await interaction.reply({ embeds });
    }
};
slashCommands.push(premiumTiers);

// 2. DETAILED SERVICE SHOWCASE
const serviceShowcase = {
    data: new SlashCommandBuilder()
        .setName("services")
        .setDescription("🔓 View all premium services in detail"),
    execute: async (interaction) => {
        const embeds = [
            EMBEDS.serviceCard(
                "WZ RANKED BOOST",
                "```\nProfessional multiplayer carry for Warzone ranked\nGuaranteed wins • Safe account handling • Expert players\n```",
                "$15-$65 (based on wins)",
                "✅ Professional handlers\n✅ Instant account return\n✅ 24/7 support\n✅ Money-back guarantee"
            ),
            EMBEDS.serviceCard(
                "MP RANKED BOOST",
                "```\nCompetitive multiplayer ranking service\nGun mastery • Loadout optimization • Rank guarantee\n```",
                "$10-$50 (based on ranks)",
                "✅ All weapons covered\n✅ Skill-based carry\n✅ Fast completion\n✅ Zero detection"
            ),
            EMBEDS.serviceCard(
                "CAMO UNLOCKS",
                "```\nInstant weapon cosmetic unlocks\nAll weapons available • Gold tier included • Permanent\n```",
                "$5-$75 (single to all)",
                "✅ Any weapon combo\n✅ Instant delivery\n✅ All tiers available\n✅ Future updates included"
            ),
            EMBEDS.serviceCard(
                "NUMBER RENTAL",
                "```\nGlobal SMS verification numbers\nUSA • UK • Russia • Indonesia • Philippines\n```",
                "$2-$75 (1 day to 90 days)",
                "✅ Instant activation\n✅ Global coverage\n✅ Privacy assured\n✅ Reusable numbers"
            ),
            EMBEDS.serviceCard(
                "OPERATOR UNLOCKS",
                "```\nExclusive operator skins & cosmetics\nVIP-only inventory • Limited edition • Endgame ready\n```",
                "$8-$80 (single to all)",
                "✅ All operators available\n✅ Instant access\n✅ Exclusive skins\n✅ Account safe"
            )
        ];
        await interaction.reply({ embeds });
    }
};
slashCommands.push(serviceShowcase);

// 3. PAYMENT GATEWAY COMMAND
const payment = {
    data: new SlashCommandBuilder()
        .setName("payment")
        .setDescription("💳 Payment information & CashApp details")
        .addStringOption(opt => opt.setName("service").setDescription("Which service?").setRequired(false)
            .addChoices(
                { name: "WZ Boost", value: "wz" },
                { name: "MP Boost", value: "mp" },
                { name: "Camos", value: "camo" },
                { name: "Numbers", value: "numbers" },
                { name: "VIP Pass", value: "vip" }
            )),
    execute: async (interaction) => {
        const service = interaction.options.getString("service") || "custom";
        
        const prices = {
            wz: "$15 - $65",
            mp: "$10 - $50",
            camo: "$5 - $75",
            numbers: "$2 - $75",
            vip: "$25 - $180"
        };

        const embed = new EmbedBuilder()
            .setColor("#9D00FF")
            .setTitle("💳 SECURE PAYMENT GATEWAY 💳")
            .setDescription(
                "```\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                "          INSTANT & SECURE TRANSACTIONS\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                "```"
            )
            .addField("💰 PAYMENT METHOD", "**CashApp Only**\n`$EvanJoyner8`", true)
            .addField("⚡ PROCESSING TIME", "Instant confirmation\nService starts in 5min", true)
            .addField("🔒 SECURITY", "✅ Encrypted transfers\n✅ Verified seller\n✅ Money-back guarantee", false)
            .addField("📋 PROCESS", 
                "1️⃣ Open CashApp\n" +
                "2️⃣ Send to `$EvanJoyner8`\n" +
                "3️⃣ Screenshot confirmation\n" +
                "4️⃣ Service starts immediately\n" +
                "5️⃣ Completion in 24h or less",
                false
            )
            .addField("💵 SERVICE AMOUNT", `\`${prices[service] || "Contact for quote"}\``, true)
            .addField("📱 CASHAPP LINK", "[Open CashApp](https://cash.app/$EvanJoyner8)", true)
            .setFooter({ text: "WEEKENDTHRILLER VERIFIED SELLER • TRUSTED BY 2800+ CUSTOMERS" })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel("💰 Send Payment (CashApp)")
                .setStyle(ButtonStyle.Link)
                .setURL("https://cash.app/$EvanJoyner8"),
            new ButtonBuilder()
                .setCustomId("confirm_payment")
                .setLabel("✅ Confirm Payment Sent")
                .setStyle(ButtonStyle.Success)
        );

        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }
};
slashCommands.push(payment);

// 4. PRICING BREAKDOWN (DETAILED)
const pricingBreakdown = {
    data: new SlashCommandBuilder()
        .setName("pricing")
        .setDescription("💰 Complete pricing & discount breakdown"),
    execute: async (interaction) => {
        const embed = new EmbedBuilder()
            .setColor("#FF00FF")
            .setTitle("💰 COMPLETE PRICING BREAKDOWN 💰")
            .setDescription(
                "```\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                "              TRANSPARENT PRICING\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                "```"
            )
            .addField(
                "🚀 WARZONE RANK BOOST",
                "```\n0-10 Wins:    $15  │  ⚡ 2-4 hours\n" +
                "10-25 Wins:   $25  │  ⚡ 4-6 hours\n" +
                "25-50 Wins:   $40  │  ⚡ 8-12 hours\n" +
                "50+ Wins:     $65  │  ⚡ 24 hours\n" +
                "Bundle 100+:  $110 │  ⚡ 48 hours (SAVE $50)```",
                false
            )
            .addField(
                "🎮 MULTIPLAYER RANK BOOST",
                "```\n0-5 Ranks:    $10  │  ⚡ 1-2 hours\n" +
                "5-10 Ranks:   $18  │  ⚡ 2-4 hours\n" +
                "10-20 Ranks:  $30  │  ⚡ 4-8 hours\n" +
                "20+ Ranks:    $50  │  ⚡ 12 hours\n" +
                "Bundle All:   $75  │  ⚡ 24 hours (SAVE $35)```",
                false
            )
            .addField(
                "🎨 CAMO UNLOCKS",
                "```\nSingle Weapon:    $5   │  ✅ Instant\n" +
                "5 Weapon Bundle:  $20  │  ✅ Instant (SAVE $5)\n" +
                "All Weapons:      $50  │  ✅ Instant (SAVE $25)\n" +
                "All + Gold Tier:  $75  │  ✅ Instant (SAVE $50)```",
                false
            )
            .addField(
                "👾 OPERATOR UNLOCKS",
                "```\nSingle Operator:   $8   │  ✅ Instant\n" +
                "5 Operator Bundle: $30  │  ✅ Instant (SAVE $10)\n" +
                "All Operators:     $80  │  ✅ Instant (SAVE $40)```",
                false
            )
            .addField(
                "📱 NUMBER RENTAL",
                "```\n1 Day:     $2   │  USA/UK/RUS/IDN/PHL\n" +
                "7 Days:    $10  │  Auto-renewal available\n" +
                "30 Days:   $30  │  Best value\n" +
                "90 Days:   $75  │  Unlimited uses (SAVE $15)```",
                false
            )
            .addField(
                "💎 VIP PASS",
                "```\n1 Month:   $25   │  10% off everything\n" +
                "3 Months:  $60   │  15% off everything (SAVE $15)\n" +
                "12 Months: $180  │  20% off everything (SAVE $120)```",
                false
            )
            .addField("🎁 TIER DISCOUNTS APPLY", 
                "BRONZE: No discount\n" +
                "SILVER: -5% | GOLD: -10% | PLATINUM: -15% | APEX: -20%",
                false
            )
            .setFooter({ text: "PAYMENT: CashApp $EvanJoyner8 | GUARANTEED LOWEST PRICES" })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
slashCommands.push(pricingBreakdown);

// 5. BUNDLE DEALS (IN DEPTH)
const bundleDeals = {
    data: new SlashCommandBuilder()
        .setName("bundles")
        .setDescription("🎁 Premium bundle deals & discounts"),
    execute: async (interaction) => {
        const embeds = [
            new EmbedBuilder()
                .setColor("#9D00FF")
                .setTitle("🎁 STARTER BUNDLE 🎁")
                .setDescription("```\nPerfect for new customers\nGet started with everything you need\n```")
                .addField("📦 INCLUDES", "✅ 20 WZ Wins\n✅ 5 Camo Unlocks\n✅ 1 Number (7 days)\n✅ Basic support", false)
                .addField("💵 PRICE", "`$50` (Save $15)", true)
                .addField("⚡ SPEED", "Complete in 24h", true)
                .setFooter({ text: "BEST FOR BEGINNERS | SAVE 23%" })
                .setTimestamp(),

            new EmbedBuilder()
                .setColor("#FF00FF")
                .setTitle("💜 VIP BUNDLE 💜")
                .setDescription("```\nUpgrade your experience\nUnlock premium features\n```")
                .addField("📦 INCLUDES", "✅ 50 WZ Wins\n✅ All Camo Unlocks\n✅ 5 Operators\n✅ 1 Month VIP Pass\n✅ Priority support", false)
                .addField("💵 PRICE", "`$120` (Save $35)", true)
                .addField("⚡ SPEED", "Complete in 48h", true)
                .setFooter({ text: "MOST POPULAR | SAVE 23%" })
                .setTimestamp(),

            new EmbedBuilder()
                .setColor("#9D00FF")
                .setTitle("👑 APEX BUNDLE 👑")
                .setDescription("```\nThe ultimate package\nFull black market access\n```")
                .addField("📦 INCLUDES", "✅ 100 WZ Wins\n✅ All Camo Unlocks\n✅ All Operators (20)\n✅ 1 Year VIP Pass\n✅ 24/7 Dedicated handler\n✅ Free monthly services", false)
                .addField("💵 PRICE", "`$250` (Save $70)", true)
                .addField("⚡ SPEED", "Complete in 72h", true)
                .setFooter({ text: "ELITE PACKAGE | SAVE 22%" })
                .setTimestamp(),

            new EmbedBuilder()
                .setColor("#FF00FF")
                .setTitle("🔓 BLACK MARKET EXCLUSIVE 🔓")
                .setDescription("```\nUltimate underground access\nNo limits • Custom everything\n```")
                .addField("📦 INCLUDES", "✅ Everything above x2\n✅ Private seller network\n✅ Custom service packages\n✅ Lifetime 20% discount\n✅ Underground perks\n✅ Priority queue always", false)
                .addField("💵 PRICE", "`CUSTOM QUOTE`", true)
                .addField("⚡ CONTACT", "Open ticket for custom deal", true)
                .setFooter({ text: "INVITATION ONLY | UNLIMITED BENEFITS" })
                .setTimestamp()
        ];

        await interaction.reply({ embeds });
    }
};
slashCommands.push(bundleDeals);

// 6. BLACK MARKET SHOWCASE (DETAILED)
const blackMarket = {
    data: new SlashCommandBuilder()
        .setName("blackmarket")
        .setDescription("🔓 Enter the black market vault"),
    execute: async (interaction) => {
        const embed = EMBEDS.blackMarketShowcase();
        
        const embed2 = new EmbedBuilder()
            .setColor("#FF00FF")
            .setTitle("🎯 WHY CHOOSE WEEKENDTHRILLER? 🎯")
            .addField("⭐ REPUTATION", "500+ 5-star reviews\n2,800+ verified customers\n99.8% uptime guarantee", true)
            .addField("🛡️ SAFETY", "✅ Account protection guaranteed\n✅ Zero bans in 30 days\n✅ Industry-standard encryption", true)
            .addField("⚡ SPEED", "✅ Instant - 24hr max\n✅ Expert handlers\n✅ 24/7 live support", false)
            .addField("💰 VALUE", "✅ Lowest prices online\n✅ Tier discounts (5-20% off)\n✅ Money-back guarantee", false)
            .addField("🔐 DISCRETION", "✅ Private tickets\n✅ No history kept\n✅ Zero logs policy", false)
            .setFooter({ text: "2,800+ HAPPY CUSTOMERS | TRUSTED SINCE DAY 1" })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("view_services")
                .setLabel("🛍️ View Services")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId("view_pricing")
                .setLabel("💰 View Pricing")
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setLabel("💳 Send Payment")
                .setStyle(ButtonStyle.Link)
                .setURL("https://cash.app/$EvanJoyner8")
        );

        await interaction.reply({ embeds: [embed, embed2], components: [row], ephemeral: false });
    }
};
slashCommands.push(blackMarket);

// 7. SECURITY & VERIFICATION
const securityInfo = {
    data: new SlashCommandBuilder()
        .setName("security")
        .setDescription("🔒 Security protocols & account protection"),
    execute: async (interaction) => {
        const embed = new EmbedBuilder()
            .setColor("#9D00FF")
            .setTitle("🔒 SECURITY & PROTECTION 🔒")
            .setDescription("```\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n    INDUSTRY LEADING SECURITY\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n```")
            .addField(
                "🛡️ ACCOUNT PROTECTION",
                "✅ End-to-end encryption\n✅ VPN routing for all activity\n✅ Isolated account handling\n✅ 2FA support available\n✅ Zero account compromises",
                false
            )
            .addField(
                "🔐 DATA SECURITY",
                "✅ Never shared with third parties\n✅ Auto-deleted after 30 days\n✅ GDPR compliant\n✅ No logs kept permanently\n✅ Encrypted databases only",
                false
            )
            .addField(
                "📊 TRACK RECORD",
                "✅ 2,800+ customers serviced\n✅ Zero bans reported (30 days)\n✅ 99.8% account safety rate\n✅ 500+ verified reviews\n✅ 5+ years of operation",
                false
            )
            .addField(
                "⚠️ RISK MITIGATION",
                "✅ Weak passwords → We use strong ones\n✅ Shared details → We isolate accounts\n✅ Multiple uses → One use only\n✅ Detection risk → Minimized by experts\n✅ Recovery guaranteed if needed",
                false
            )
            .addField("💡 BEST PRACTICES", 
                "1. Never share your password\n" +
                "2. Keep account isolated\n" +
                "3. Enable 2FA if possible\n" +
                "4. Change password after service\n" +
                "5. Monitor account activity",
                false
            )
            .setFooter({ text: "YOUR SAFETY IS OUR PRIORITY | VERIFIED SECURE PLATFORM" })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
slashCommands.push(securityInfo);

// 8. TESTIMONIALS & REVIEWS
const testimonials = {
    data: new SlashCommandBuilder()
        .setName("testimonials")
        .setDescription("⭐ Real customer reviews & testimonials"),
    execute: async (interaction) => {
        const embed = new EmbedBuilder()
            .setColor("#FF00FF")
            .setTitle("⭐ CUSTOMER TESTIMONIALS ⭐")
            .setDescription("```\n500+ 5-STAR REVIEWS\n98.7% SATISFACTION RATE\n```")
            .addField(
                "⭐⭐⭐⭐⭐ @Shadow",
                "\"Got 50 wins in 2 days. Absolutely insane service. Fastest I've ever seen. Worth every dollar.\"",
                false
            )
            .addField(
                "⭐⭐⭐⭐⭐ @Ghost",
                "\"Fast, reliable, and professional. They know what they're doing. 10/10 would recommend.\"",
                false
            )
            .addField(
                "⭐⭐⭐⭐⭐ @Apex",
                "\"Support team is incredible. Had an issue, they fixed it in 5 minutes. Amazing experience.\"",
                false
            )
            .addField(
                "⭐⭐⭐⭐⭐ @Titan",
                "\"Been ordering for 6 months. Never had a single problem. 25 purchases, 25 perfect completions.\"",
                false
            )
            .addField(
                "⭐⭐⭐⭐⭐ @Rogue",
                "\"Account is still safe. No bans. No issues. Exactly what they promised. Elite service.\"",
                false
            )
            .addField("📊 STATS", 
                "✅ 500+ verified 5-star reviews\n✅ 2,800+ total customers\n✅ 98.7% satisfaction rate\n✅ Zero complaints in 30 days\n✅ Thousands of successful completions",
                false
            )
            .setFooter({ text: "REAL REVIEWS FROM REAL CUSTOMERS | VERIFIED TRANSACTIONS" })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
slashCommands.push(testimonials);

// 9. FAQ (DETAILED)
const faqDetailed = {
    data: new SlashCommandBuilder()
        .setName("faq")
        .setDescription("❓ Frequently asked questions in depth"),
    execute: async (interaction) => {
        const embed = new EmbedBuilder()
            .setColor("#9D00FF")
            .setTitle("❓ FREQUENTLY ASKED QUESTIONS ❓")
            .addField(
                "Q: Is my account really safe?",
                "✅ YES. We use industry-standard encryption, VPN routing, and isolated account handling. Zero bans reported in 30 days across 2,800+ customers. Your account is safer with us than most gaming companies.",
                false
            )
            .addField(
                "Q: How fast is the service?",
                "✅ INSTANT to 24 hours. Most services complete within hours. WZ boosting takes 2-24 hours depending on wins. All services guaranteed completion within stated timeframe or money back.",
                false
            )
            .addField(
                "Q: Do you really offer money-back guarantee?",
                "✅ YES. 100% money-back within 48 hours if unsatisfied. No questions asked. We're that confident in our service.",
                false
            )
            .addField(
                "Q: Will my account get banned?",
                "✅ NO. Zero bans reported. We use expert handlers, safe methods, and account isolation. Detection risk is minimized through years of experience and expertise.",
                false
            )
            .addField(
                "Q: What if something goes wrong?",
                "✅ We handle it. Account compromised? Full recovery included. Service didn't complete? Full refund. Support is 24/7 and responds in under 5 minutes.",
                false
            )
            .addField(
                "Q: How do I pay?",
                "✅ CashApp only. Send to `$EvanJoyner8` and confirm via screenshot. Instant processing. No fees. Secure.",
                false
            )
            .addField(
                "Q: Can I choose specific games/weapons/ranks?",
                "✅ YES. Tell us exactly what you want. WZ wins, specific guns, exact camos. We customize everything.",
                false
            )
            .addField(
                "Q: Is this legal?",
                "✅ Service is a digital product. Account boosting exists in a gray area but is widely used. We take no responsibility for account violations by users.",
                false
            )
            .setFooter({ text: "MORE QUESTIONS? OPEN A TICKET OR SEND DM" })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
slashCommands.push(faqDetailed);

// 10. VIP PERKS & BENEFITS
const vipPerks = {
    data: new SlashCommandBuilder()
        .setName("vipperks")
        .setDescription("💎 Exclusive VIP member perks & benefits"),
    execute: async (interaction) => {
        const embeds = [
            new EmbedBuilder()
                .setColor("#FF00FF")
                .setTitle("💜 SILVER VIP PERKS 💜")
                .setDescription("6-15 purchases | Unlock benefits automatically")
                .addField("🎁 BENEFITS", 
                    "✅ 5% off all services\n" +
                    "✅ Priority support (under 10min)\n" +
                    "✅ VIP badge in server\n" +
                    "✅ Early access to promos\n" +
                    "✅ Monthly surprise gift",
                    false
                )
                .setFooter({ text: "NEXT TIER AT 15 PURCHASES" })
                .setTimestamp(),

            new EmbedBuilder()
                .setColor("#FF00FF")
                .setTitle("🥇 GOLD VIP PERKS 🥇")
                .setDescription("16-30 purchases | Premium treatment")
                .addField("🎁 BENEFITS",
                    "✅ 10% off all services\n" +
                    "✅ VIP support (under 5min)\n" +
                    "✅ Custom service packages\n" +
                    "✅ Free monthly services\n" +
                    "✅ Priority queue access\n" +
                    "✅ Exclusive VIP events",
                    false
                )
                .setFooter({ text: "NEXT TIER AT 30 PURCHASES" })
                .setTimestamp(),

            new EmbedBuilder()
                .setColor("#FF00FF")
                .setTitle("💜 PLATINUM VIP PERKS 💜")
                .setDescription("31+ purchases | Elite status")
                .addField("🎁 BENEFITS",
                    "✅ 15% off all services\n" +
                    "✅ 24/7 dedicated handler\n" +
                    "✅ Custom service packages\n" +
                    "✅ Monthly free services worth $100\n" +
                    "✅ Always priority queue\n" +
                    "✅ Private VIP Discord channel\n" +
                    "✅ Lifetime benefits",
                    false
                )
                .setFooter({ text: "ELITE TIER • ULTIMATE BENEFITS" })
                .setTimestamp(),

            new EmbedBuilder()
                .setColor("#9D00FF")
                .setTitle("👑 APEX LEGENDARY 👑")
                .setDescription("100+ purchases | Underground access")
                .addField("🎁 BENEFITS",
                    "✅ 20% off EVERYTHING\n" +
                    "✅ Private seller network\n" +
                    "✅ No limits policy\n" +
                    "✅ Custom pricing available\n" +
                    "✅ Weekly free services\n" +
                    "✅ Lifetime account recovery\n" +
                    "✅ VIP event invitations\n" +
                    "✅ Exclusive perks list",
                    false
                )
                .setFooter({ text: "LEGENDARY STATUS • UNLIMITED BENEFITS" })
                .setTimestamp()
        ];

        await interaction.reply({ embeds });
    }
};
slashCommands.push(vipPerks);

// =====================================================================
// END OF 10 FIRE COMMANDS
// =====================================================================
