// bot.js
// Everything the bot does at runtime lives here: client setup, routing
// interactions to the right handler in commands.js, and the giveaway
// end-check loop. Slash command *registration* with Discord happens in
// deploy-commands.js (run automatically on boot, see package.json).

require("dotenv").config();

const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes } = require("discord.js");
const {
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
    checkWeeklyRecap,
    checkHeists
} = require("./commands");

// ---------------------------------------------------------------------------
// CRITICAL SAFETY NET - without this, ANY uncaught error anywhere in the
// process (a bad setTimeout callback, an unhandled promise rejection, a
// third-party library quirk) takes the ENTIRE bot offline instantly. This is
// exactly what happened with the ticket-close bug - log it and keep running
// instead of dying.
// ---------------------------------------------------------------------------
process.on("uncaughtException", (error) => {
    console.error("🛑 [uncaughtException] The bot almost crashed but this handler caught it:", error);
});
process.on("unhandledRejection", (reason) => {
    console.error("🛑 [unhandledRejection] The bot almost crashed but this handler caught it:", reason);
});

// ---------------------------------------------------------------------------
// TOKEN DIAGNOSTIC - never prints the token itself, just tells you if it's
// malformed (hidden whitespace/newlines, wrong length, wrong shape, etc.)
// A real Discord bot token is 3 dot-separated base64url segments and has NO
// whitespace of any kind in it.
// ---------------------------------------------------------------------------
(function checkToken(){
    const raw = process.env.TOKEN;

    console.log("--- TOKEN diagnostic ---");

    if(!raw){
        console.log("❌ TOKEN is completely missing/undefined in this environment.");
        return;
    }

    console.log("Length:", raw.length);
    console.log("Has leading/trailing whitespace:", raw !== raw.trim());
    console.log("Contains newline character:", /[\r\n]/.test(raw));
    console.log("Contains any whitespace anywhere:", /\s/.test(raw));
    console.log("Contains non-printable/control characters:", /[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(raw));
    console.log("Segment count (should be 3, separated by dots):", raw.trim().split(".").length);
    console.log("First 6 chars:", raw.slice(0, 6));
    console.log("Last 6 chars:", raw.slice(-6));
    console.log("------------------------");
})();

// ---------------------------------------------------------------------------
// SLASH COMMAND DEPLOYMENT
// Registers all commands with Discord on every boot - folded in here so the
// whole bot is just two files (bot.js + commands.js) instead of needing a
// separate deploy-commands.js run first. If GUILD_ID is set, commands deploy
// instantly to that one server; otherwise they deploy globally (can take up
// to ~1hr to first appear, but works everywhere).
// ---------------------------------------------------------------------------
async function deploySlashCommands(){

    const CLIENT_ID = process.env.CLIENT_ID;
    const GUILD_ID = process.env.GUILD_ID || null;

    if(!process.env.TOKEN || !CLIENT_ID){
        console.error("❌ Missing TOKEN or CLIENT_ID in environment - cannot deploy commands.");
        return;
    }

    const body = slashCommands.map(c => c.data.toJSON());
    const rest = new REST({ version: "10" }).setToken(process.env.TOKEN.trim());

    try{

        console.log(`🚀 Deploying ${body.length} slash commands...`);
        console.log(GUILD_ID ? `📌 Guild ID: ${GUILD_ID} (instant, single-server)` : "📌 Global deploy (can take up to 1hr to appear)");

        const route = GUILD_ID
            ? Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID)
            : Routes.applicationCommands(CLIENT_ID);

        await rest.put(route, { body });

        console.log("✅ Slash commands deployed successfully!");

    }catch(error){

        console.error("❌ Command deployment failed:", error.message);

        if(error.code === 50001){
            console.error(
                "\n👉 'Missing Access' usually means the bot's invite link was missing the " +
                "'applications.commands' OAuth2 scope, or GUILD_ID doesn't match a server the " +
                "bot is actually in. Re-invite the bot with:\n" +
                `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&permissions=8&scope=bot%20applications.commands\n`
            );
        }

    }

}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Build a quick lookup map: commandName -> execute()
const allCommands = [...slashCommands];
const commandMap = new Map(allCommands.map(c => [c.data.name, c.execute]));
const autocompleteMap = new Map(allCommands.filter(c => c.autocomplete).map(c => [c.data.name, c.autocomplete]));

// Small context object (brand name/color for embeds) passed as a second
// argument to command/button handlers
const ctx = { brandName: CONFIG.BRAND_NAME, brandColor: CONFIG.COLOR };

const allButtonHandlers = { ...buttonHandlers };
const allModalHandlers = { ...modalHandlers };

client.once("clientReady", async () => {
    console.log(`💎 ${client.user.tag} is online`);
    client.user.setActivity(`${CONFIG.BRAND_NAME} | Orders`);

    console.log("--- Config check ---");
    console.log("VOUCH_CHANNEL_ID:", CONFIG.VOUCH_CHANNEL_ID || "❌ NOT SET");
    console.log("LEAVE_VOUCH_CHANNEL_ID:", CONFIG.LEAVE_VOUCH_CHANNEL_ID || "❌ NOT SET");
    console.log("WEBSITE_URL:", CONFIG.WEBSITE_URL || "❌ NOT SET");
    console.log("--------------------");

    await deploySlashCommands();
});

client.on("interactionCreate", async (interaction) => {

    const label = interaction.isChatInputCommand() || interaction.isAutocomplete() ? `/${interaction.commandName}`
        : interaction.customId ? `[${interaction.customId}]`
        : "[unknown interaction]";

    console.log(`[interaction] ${label} from ${interaction.user.tag}`);

    try{

        if(interaction.isAutocomplete()){
            const autocomplete = autocompleteMap.get(interaction.commandName);
            if(autocomplete) await autocomplete(interaction);
            return;
        }

        if(interaction.isChatInputCommand()){

            if(CONFIG.ALLOWED_ROLE_ID && !interaction.member?.roles?.cache?.has(CONFIG.ALLOWED_ROLE_ID)){
                return interaction.reply({ content: "❌ You don't have permission to use commands on this bot.", ephemeral: true }).catch(() => {});
            }

            const execute = commandMap.get(interaction.commandName);
            if(execute){
                await execute(interaction, ctx);
                console.log(`[interaction] ${label} completed OK`);
            }else{
                console.log(`[interaction] ❌ no handler registered for ${label}`);
            }
            return;
        }

        if(interaction.isButton()){
            // Exact match first (covers almost every button in the bot)
            let handler = allButtonHandlers[interaction.customId];

            // Fallback: dynamic IDs like "app_accept_APP-0001" route to the
            // generic "app_accept" handler, which parses the app ID itself
            if(!handler){
                if(interaction.customId.startsWith("app_accept_")) handler = allButtonHandlers.app_accept;
                else if(interaction.customId.startsWith("app_deny_")) handler = allButtonHandlers.app_deny;
                else if(interaction.customId.startsWith("buy_custom_")) handler = allButtonHandlers.buy_custom;
            }

            if(handler){
                await handler(interaction, ctx);
                console.log(`[interaction] ${label} completed OK`);
            }else{
                await interaction.reply({ content: "❌ Button not configured.", ephemeral: true }).catch(() => {});
            }
            return;
        }

        if(interaction.isStringSelectMenu()){
            // Exact match first (covers almost every select menu in the bot)
            let handler = selectHandlers[interaction.customId];

            // Fallback: dynamic IDs like "rankcalc_desired_5" route to the
            // generic "rankcalc_desired" handler, which parses the current
            // rank index out of its own customId - same pattern as the
            // app_accept_/app_deny_ button routing below.
            if(!handler && interaction.customId.startsWith("rankcalc_desired_")){
                handler = selectHandlers.rankcalc_desired;
            }
            if(!handler && interaction.customId.startsWith("thriller_select_")){
                handler = selectHandlers.thriller_select;
            }

            if(handler){
                await handler(interaction);
                console.log(`[interaction] ${label} completed OK`);
            }
            return;
        }

        if(interaction.isModalSubmit()){
            // Exact match first, with a prefix fallback for dynamic modal IDs
            // like "blueprint_form_vault_1a1a1a" (layout+color encoded in the
            // customId itself, since modals can't carry hidden state any
            // other way) - same pattern as the button/select routing above.
            let handler = allModalHandlers[interaction.customId];
            if(!handler && interaction.customId.startsWith("blueprint_form_")){
                handler = allModalHandlers.blueprint_form;
            }
            if(handler){
                await handler(interaction);
                console.log(`[interaction] ${label} completed OK`);
            }
            return;
        }

    }catch(error){

        console.error(`[interaction] ❌ ${label} threw:`, error);

        // Show the *real* error instead of a useless generic message, so you
        // don't have to dig through Railway logs every single time.
        const detail = `\`${error.code ? error.code + ": " : ""}${error.message}\``;

        try{
            if(!interaction.replied && !interaction.deferred){
                await interaction.reply({ content: `❌ Something went wrong: ${detail}`, ephemeral: true });
            }else{
                await interaction.followUp({ content: `❌ Something went wrong: ${detail}`, ephemeral: true });
            }
        }catch(replyErr){
            console.error(`[interaction] ❌ ${label} - even the fallback error reply failed:`, replyErr.message);
        }

    }

});

// ---------------------------------------------------------------------------
// GIVEAWAY END-CHECK LOOP
// ---------------------------------------------------------------------------

client.on("guildMemberAdd", async (member) => {
    try{
        await handleNewMember(member);
    }catch(error){
        console.error("Welcome/autorole handler error:", error);
    }
});

client.on("guildAuditLogEntryCreate", async (entry, guild) => {
    try{
        await handleAuditLogEntry(entry, guild);
    }catch(error){
        console.error("Anti-nuke handler error:", error);
    }
});

client.on("messageCreate", async (message) => {
    try{
        const handled = await handleSecurityChecks(message);
        if(handled) return; // message was deleted as a security violation, stop here

        await handleAiSupportMessage(message);
    }catch(error){
        console.error("messageCreate handler error:", error);
    }
});

setInterval(async () => {

    const giveaways = giveawaysDB.read();
    let changed = false;

    for(const [messageId, g] of Object.entries(giveaways)){

        if(g.ended || Date.now() < g.endTime) continue;

        g.ended = true;
        changed = true;

        try{

            const channel = await client.channels.fetch(g.channelId).catch(() => null);
            if(!channel) continue;

            const winnerCount = g.winnerCount || 1;
            const shuffled = [...g.entries].sort(() => 0.5 - Math.random());
            const winners = shuffled.slice(0, winnerCount);

            const embed = new EmbedBuilder()
                .setColor("#b026ff")
                .setTitle("🎉 GIVEAWAY ENDED")
                .setDescription(
                    `🎁 **Prize**\n${g.prize}\n\n` +
                    `🏆 **Winner${winners.length > 1 ? "s" : ""}**\n${winners.length ? winners.map(id => `<@${id}>`).join(", ") : "No valid entries"}\n\n` +
                    `👥 **Entries**\n${g.entries.length}`
                )
                .setTimestamp();

            await channel.send({
                content: winners.length
                    ? `🎊 Congratulations ${winners.map(id => `<@${id}>`).join(", ")}! You won **${g.prize}**!`
                    : "⚠️ Giveaway ended, no one entered.",
                embeds: [embed]
            });

        }catch(err){
            console.log(`[giveaway] ❌ could not announce winner for ${messageId}: ${err.message}`);
        }

    }

    if(changed) giveawaysDB.write(giveaways);

    try{
        await checkHeists(client);
    }catch(err){
        console.error("[heist] interval error:", err);
    }

}, 10000);

// Checks for scheduled announcements whose time has come, and (once a day)
// whether it's time to post the weekly recap.
setInterval(async () => {
    try{
        await checkScheduledPosts(client);
    }catch(err){
        console.error("[schedule] interval error:", err);
    }
    try{
        await checkWeeklyRecap(client);
    }catch(err){
        console.error("[recap] interval error:", err);
    }
}, 60000);

client.login(process.env.TOKEN.trim());
