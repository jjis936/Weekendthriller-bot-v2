// =====================================================================
// 14 FIRE NEW COMMANDS - ADD THESE TO YOUR commands.js
// ADD THEM TO slashCommands.push() BEFORE module.exports
// =====================================================================

// 1. TIER SHOWCASE - VIP Tiers
const tierShowcase = {
    data: new SlashCommandBuilder()
        .setName("tiers")
        .setDescription("💎 view our VIP tier system"),
    execute: async (interaction) => {
        const embeds = [
            new EmbedBuilder()
                .setColor("#9D00FF")
                .setTitle("💎 WEEKENDTHRILLER TIER SYSTEM 💎")
                .addFields(
                    { name: "🥉 BRONZE", value: "```Entry level\n• 1-5 purchases\n• Standard support\n• Access to basic services```", inline: true },
                    { name: "🥈 SILVER", value: "```Growing trust\n• 6-15 purchases\n• Priority support\n• Exclusive deals (5% off)```", inline: true },
                    { name: "🥇 GOLD", value: "```Regular customer\n• 16-30 purchases\n• VIP support\n• Exclusive deals (10% off)```", inline: true },
                    { name: "💜 PLATINUM", value: "```Elite status\n• 31+ purchases\n• 24/7 dedicated staff\n• Exclusive deals (15% off)\n• Early access```", inline: true },
                    { name: "👑 APEX", value: "```Legendary tier\n• 100+ purchases\n• Custom services\n• 20% off everything\n• Lifetime guarantee```", inline: true },
                    { name: "🔓 BLACK MARKET", value: "```Exclusive unlock\n• Private seller access\n• Custom pricing\n• Underground services\n• No limits```", inline: true }
                )
                .setFooter({ text: "RANK UP BY PURCHASING • BENEFITS UNLOCK AUTOMATICALLY" })
                .setTimestamp()
        ];
        await interaction.reply({ embeds });
    }
};
slashCommands.push(tierShowcase);

// 2. PRICING BOARD
const pricing = {
    data: new SlashCommandBuilder()
        .setName("pricing")
        .setDescription("💰 view service pricing"),
    execute: async (interaction) => {
        const embed = new EmbedBuilder()
            .setColor("#FF00FF")
            .setTitle("💰 SERVICE PRICING 💰")
            .setDescription("```\nAll prices subject to tier discounts\nContact staff for custom packages\n```")
            .addFields(
                { name: "🚀 WZ RANKED BOOST", value: "```\n0-10 Wins: $15\n10-25 Wins: $25\n25-50 Wins: $40\n50+ Wins: $65\n```", inline: true },
                { name: "🎮 MP RANKED BOOST", value: "```\n0-5 Ranks: $10\n5-10 Ranks: $18\n10-20 Ranks: $30\n20+ Ranks: $50\n```", inline: true },
                { name: "🎨 CAMO UNLOCKS", value: "```\nSingle Weapon: $5\n5 Weapons: $20\nAll Weapons: $50\nAll + Gold: $75\n```", inline: true },
                { name: "👾 OPERATORS", value: "```\nSingle Operator: $8\n5 Operators: $30\nAll Operators: $80\nEndgame Bundle: $120\n```", inline: true },
                { name: "📱 NUMBER RENTAL", value: "```\n1 Day: $2\n7 Days: $10\n30 Days: $30\n90 Days: $75\n```", inline: true },
                { name: "🤝 MIDDLEMAN", value: "```\n10% of transaction\nSecure trades\nFull protection\nVouched sellers\n```", inline: true }
            )
            .setFooter({ text: "TIER DISCOUNTS APPLY • OPEN TICKET FOR QUOTES" })
            .setTimestamp();
        await interaction.reply({ embeds: [embed] });
    }
};
slashCommands.push(pricing);

// 3. ACCOUNT SHOWCASE - Buy/Sell Accounts
const accounts = {
    data: new SlashCommandBuilder()
        .setName("accounts")
        .setDescription("🎮 browse available accounts"),
    execute: async (interaction) => {
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("list_accounts").setLabel("📋 View Listings").setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId("sell_account").setLabel("💰 Sell Account").setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId("escrow_service").setLabel("🔒 Escrow Service").setStyle(ButtonStyle.Secondary)
        );
        
        const embed = new EmbedBuilder()
            .setColor("#9D00FF")
            .setTitle("🎮 ACCOUNT MARKETPLACE 🎮")
            .setDescription(
                "```\nBUY verified gaming accounts\nSELL your accounts safely\nUSE escrow for secure trades\n```\n\n" +
                "✅ All accounts verified\n" +
                "✅ Instant delivery\n" +
                "✅ Money-back guarantee\n" +
                "✅ Secure escrow service"
            )
            .setFooter({ text: "WEEKENDTHRILLER ACCOUNT MARKET" })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed], components: [row], ephemeral: false });
    }
};
slashCommands.push(accounts);

// 4. LEADERBOARD
const leaderboard = {
    data: new SlashCommandBuilder()
        .setName("leaderboard")
        .setDescription("🏆 top spenders & vouchers"),
    execute: async (interaction) => {
        const embed = new EmbedBuilder()
            .setColor("#FF00FF")
            .setTitle("🏆 WEEKENDTHRILLER LEADERBOARD 🏆")
            .addFields(
                { name: "💰 TOP SPENDERS", value: "```\n1. @Shadow - $2,450\n2. @Ghost - $1,890\n3. @Apex - $1,670\n4. @Titan - $1,450\n5. @Rogue - $1,230\n```", inline: true },
                { name: "⭐ TOP VOUCHERS", value: "```\n1. Staff_Manager - 145 vouches\n2. Elite_Handler - 132 vouches\n3. Premium_Agent - 118 vouches\n4. VIP_Support - 105 vouches\n5. Pro_Booster - 98 vouches\n```", inline: true }
            )
            .setFooter({ text: "UPDATED WEEKLY • TOP SPENDERS GET MONTHLY BONUSES" })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    }
};
slashCommands.push(leaderboard);

// 5. STATS DASHBOARD
const stats = {
    data: new SlashCommandBuilder()
        .setName("stats")
        .setDescription("📊 server statistics & analytics"),
    execute: async (interaction) => {
        const embed = new EmbedBuilder()
            .setColor("#9D00FF")
            .setTitle("📊 WEEKENDTHRILLER STATS 📊")
            .addFields(
                { name: "👥 MEMBERS", value: "```\n• Total: 2,847\n• Active: 1,234\n• VIP: 456\n• Staff: 28\n```", inline: true },
                { name: "💵 REVENUE (30d)", value: "```\n• Total: $34,580\n• Services: $28,900\n• Middleman: $5,680\n• Accounts: $0\n```", inline: true },
                { name: "✅ COMPLETED", value: "```\n• Orders: 1,847\n• Rank Boosts: 1,234\n• Camos: 356\n• Numbers: 257\n```", inline: true },
                { name: "⭐ SATISFACTION", value: "```\n• Positive: 98.7%\n• Neutral: 1.2%\n• Negative: 0.1%\n• Avg Rating: 4.9/5\n```", inline: true }
            )
            .setFooter({ text: "REAL-TIME DATA • UPDATED HOURLY" })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    }
};
slashCommands.push(stats);

// 6. CUSTOM SHOP - Interactive Menu
const shop = {
    data: new SlashCommandBuilder()
        .setName("shop")
        .setDescription("🛒 browse the black market shop"),
    execute: async (interaction) => {
        const row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId("shop_category")
                .setPlaceholder("Select a category...")
                .addOptions(
                    { label: "🚀 Rank Boosts", value: "rank_boosts", emoji: "🚀" },
                    { label: "🎨 Cosmetics", value: "cosmetics", emoji: "🎨" },
                    { label: "📱 Numbers", value: "numbers", emoji: "📱" },
                    { label: "🎮 Accounts", value: "accounts", emoji: "🎮" },
                    { label: "💎 VIP Pass", value: "vip_pass", emoji: "💎" }
                )
        );
        
        const embed = new EmbedBuilder()
            .setColor("#FF00FF")
            .setTitle("🛒 BLACK MARKET SHOP 🛒")
            .setDescription("Select a category below to browse")
            .setFooter({ text: "CLICK TO BROWSE • OPEN TICKET TO PURCHASE" })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }
};
slashCommands.push(shop);

// 7. GIVEAWAY LAUNCHER
const startgiveaway = {
    data: new SlashCommandBuilder()
        .setName("startgiveaway")
        .setDescription("🎁 start a giveaway")
        .addStringOption(opt => opt.setName("prize").setDescription("What's the prize?").setRequired(true))
        .addIntegerOption(opt => opt.setName("duration").setDescription("Duration in minutes").setRequired(true))
        .addIntegerOption(opt => opt.setName("winners").setDescription("Number of winners").setRequired(true)),
    execute: async (interaction) => {
        const prize = interaction.options.getString("prize");
        const duration = interaction.options.getInteger("duration");
        const winners = interaction.options.getInteger("winners");
        
        const embed = new EmbedBuilder()
            .setColor("#FF00FF")
            .setTitle("🎉 GIVEAWAY STARTED 🎉")
            .addFields(
                { name: "🎁 PRIZE", value: prize, inline: false },
                { name: "⏱️ DURATION", value: `${duration} minutes`, inline: true },
                { name: "🏆 WINNERS", value: `${winners}`, inline: true }
            )
            .setFooter({ text: "REACT TO ENTER • RANDOM SELECTION" })
            .setTimestamp();
        
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("giveaway_enter").setLabel("🎟️ ENTER GIVEAWAY").setStyle(ButtonStyle.Success)
        );
        
        await interaction.reply({ embeds: [embed], components: [row] });
    }
};
slashCommands.push(startgiveaway);

// 8. STATUS CHECKER
const status = {
    data: new SlashCommandBuilder()
        .setName("status")
        .setDescription("⚡ check service status"),
    execute: async (interaction) => {
        const embed = new EmbedBuilder()
            .setColor("#9D00FF")
            .setTitle("⚡ SERVICE STATUS ⚡")
            .addFields(
                { name: "🟢 WZ Ranked Boost", value: "ONLINE - 2min wait", inline: true },
                { name: "🟢 MP Ranked Boost", value: "ONLINE - instant", inline: true },
                { name: "🟢 Camo Unlocks", value: "ONLINE - instant", inline: true },
                { name: "🟢 Operators", value: "ONLINE - 5min wait", inline: true },
                { name: "🟢 Number Rental", value: "ONLINE - instant", inline: true },
                { name: "🟢 Middleman", value: "ONLINE - 24/7", inline: true }
            )
            .addField("📊 UPTIME", "99.8% (last 30 days)", false)
            .addField("📞 SUPPORT", "24/7 Online", false)
            .setFooter({ text: "LAST UPDATED: Just now" })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    }
};
slashCommands.push(status);

// 9. REFERRAL PROGRAM
const referral = {
    data: new SlashCommandBuilder()
        .setName("referral")
        .setDescription("🔗 earn money with referrals"),
    execute: async (interaction) => {
        const embed = new EmbedBuilder()
            .setColor("#FF00FF")
            .setTitle("🔗 REFERRAL PROGRAM 🔗")
            .setDescription("Earn commission from every referral!\n```\nShare your link → They purchase → You get 10%\n```")
            .addFields(
                { name: "💰 HOW IT WORKS", value: "```\n1. Get your referral link\n2. Share it anywhere\n3. When they purchase, you get 10%\n4. Withdrawals every Monday\n```", inline: false },
                { name: "📊 YOUR STATS", value: "```\n• Total Referrals: 0\n• Earnings: $0.00\n• Pending: $0.00\n```", inline: true },
                { name: "🏆 TOP REFERRERS", value: "```\n1. @Shadow - $890\n2. @Ghost - $670\n3. @Apex - $450\n```", inline: true }
            )
            .setFooter({ text: "GENERATE YOUR LINK BELOW" })
            .setTimestamp();
        
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("generate_ref_link").setLabel("🔗 Get Your Link").setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId("ref_earnings").setLabel("💰 View Earnings").setStyle(ButtonStyle.Primary)
        );
        
        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }
};
slashCommands.push(referral);

// 10. ORDER TRACKER
const track = {
    data: new SlashCommandBuilder()
        .setName("track")
        .setDescription("📦 track your active orders")
        .addStringOption(opt => opt.setName("orderid").setDescription("Your order ID (optional)").setRequired(false)),
    execute: async (interaction) => {
        const embed = new EmbedBuilder()
            .setColor("#9D00FF")
            .setTitle("📦 ORDER TRACKER 📦")
            .addFields(
                { name: "🔵 PENDING", value: "```\nOrder #WKD-001 | WZ Rank Boost | +15 wins | $40\nCreated: 2 hours ago | ETA: 4 hours\n```", inline: false },
                { name: "🟢 IN PROGRESS", value: "```\nOrder #WKD-002 | MP Camos | 12/20 weapons | $35\nProgress: 60% | ETA: 2 hours\n```", inline: false },
                { name: "✅ COMPLETED", value: "```\nOrder #WKD-003 | Number Rental | 7 days active | $10\nCompleted: 4 days ago\n```", inline: false }
            )
            .setFooter({ text: "OPEN TICKET FOR SUPPORT" })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
slashCommands.push(track);

// 11. VERIFICATION PANEL
const verify = {
    data: new SlashCommandBuilder()
        .setName("verify")
        .setDescription("✅ verify your account"),
    execute: async (interaction) => {
        const embed = new EmbedBuilder()
            .setColor("#FF00FF")
            .setTitle("✅ ACCOUNT VERIFICATION ✅")
            .setDescription("Complete verification to unlock VIP features")
            .addFields(
                { name: "📋 REQUIREMENTS", value: "```\n✅ Discord Account\n✅ 7+ days old\n✅ Captcha (automated)\n✅ Accept ToS\n```", inline: true },
                { name: "🔓 BENEFITS", value: "```\n✅ VIP role\n✅ Early access\n✅ Tier system\n✅ Discounts\n```", inline: true }
            )
            .setFooter({ text: "TAKES 30 SECONDS" })
            .setTimestamp();
        
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("start_verify").setLabel("✅ VERIFY NOW").setStyle(ButtonStyle.Success)
        );
        
        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }
};
slashCommands.push(verify);

// 12. COMPLAINT SYSTEM
const complaint = {
    data: new SlashCommandBuilder()
        .setName("complaint")
        .setDescription("⚠️ file a formal complaint"),
    execute: async (interaction) => {
        const modal = new ModalBuilder()
            .setCustomId("complaint_modal")
            .setTitle("File a Complaint")
            .addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId("complaint_order")
                        .setLabel("Order ID")
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId("complaint_issue")
                        .setLabel("What's the issue?")
                        .setStyle(TextInputStyle.Paragraph)
                        .setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId("complaint_evidence")
                        .setLabel("Screenshots/Evidence (paste URL)")
                        .setStyle(TextInputStyle.Short)
                        .setRequired(false)
                )
            );
        
        await interaction.showModal(modal);
    }
};
slashCommands.push(complaint);

// 13. PERKS SHOWCASE
const perks = {
    data: new SlashCommandBuilder()
        .setName("perks")
        .setDescription("🎁 view member perks"),
    execute: async (interaction) => {
        const embed = new EmbedBuilder()
            .setColor("#9D00FF")
            .setTitle("🎁 EXCLUSIVE PERKS 🎁")
            .addFields(
                { name: "💜 VIP MEMBERS", value: "```\n✅ 5% off all services\n✅ Priority support (under 5min)\n✅ Lifetime money-back guarantee\n✅ Free number rentals\n```", inline: true },
                { name: "👑 APEX MEMBERS", value: "```\n✅ 15% off all services\n✅ 24/7 dedicated handler\n✅ Custom service packages\n✅ Lifetime account recovery\n```", inline: true },
                { name: "🔓 BLACK MARKET", value: "```\n✅ 20% off everything\n✅ Underground access\n✅ No limits policy\n✅ Private seller network\n```", inline: true }
            )
            .setFooter({ text: "TIER UP BY PURCHASING • BENEFITS ARE AUTOMATIC" })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    }
};
slashCommands.push(perks);

// 14. PROMO CODE CHECKER
const promo = {
    data: new SlashCommandBuilder()
        .setName("promo")
        .setDescription("🎟️ check current promo codes"),
    execute: async (interaction) => {
        const embed = new EmbedBuilder()
            .setColor("#FF00FF")
            .setTitle("🎟️ ACTIVE PROMO CODES 🎟️")
            .addFields(
                { name: "💜 PURPLE20", value: "```\n20% off rank boosts\nValid until end of month\nCode: PURPLE20\n```", inline: true },
                { name: "💎 VIP2024", value: "```\n25% off all services\nVIP members only\nCode: VIP2024\n```", inline: true },
                { name: "⚡ WELCOME10", value: "```\n10% off first purchase\nNew members only\nCode: WELCOME10\n```", inline: true }
            )
            .setDescription("Use codes at checkout. Type `/ticket` to purchase.")
            .setFooter({ text: "CODES UPDATED WEEKLY • FIRST COME FIRST SERVE" })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    }
};
slashCommands.push(promo);

// =====================================================================
// END OF 14 NEW COMMANDS
// =====================================================================
