const https = require('https');

function sendDiscordNotification(data) {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    console.log("[DEBUG] === WEBHOOK START ===");
    console.log("[DEBUG] WEBHOOK URL:", webhookUrl);

    if (!webhookUrl) {
        console.error("[DEBUG] WEBHOOK ERROR: DISCORD_WEBHOOK_URL is not defined in env variables.");
        console.log("[DEBUG] === WEBHOOK END ===");
        return;
    }

    // Check if it's widget or guild url
    if (webhookUrl.includes('/widget.json') || webhookUrl.includes('/api/guilds/')) {
        console.warn("[DEBUG] WEBHOOK WARNING: The URL provided appears to be a Discord Widget or Guild URL, NOT a Webhook URL.");
        console.warn("[DEBUG] NOTE: A Discord Widget URL (ending in /widget.json) only returns information about the guild. It cannot be used to POST messages.");
        console.warn("[DEBUG] A valid Discord Webhook URL must follow the format: https://discord.com/api/webhooks/WEBHOOK_ID/WEBHOOK_TOKEN");
    }

    // Format timestamp
    const now = new Date();
    const ts = now.toISOString().replace('T', ' ').substring(0, 16);

    const description = data.message 
        ? `**User Name:**\n${data.user}\n\n**Secret Code:**\n${data.message}\n\n**Stage:**\n${data.stage}\n\n**Timestamp:**\n${ts}`
        : `**User Name:**\n${data.user}\n\n**Event:**\n${data.event}\n\n**Stage:**\n${data.stage}\n\n**Timestamp:**\n${ts}`;

    // Payload with embed
    const embedPayload = {
        embeds: [{
            title: "LOVE ENGINE PRO",
            description: description,
            color: 0xff4fd8, // Neon Pink
            thumbnail: {
                url: "https://i.imgur.com/W2Yk9uO.png"
            }
        }]
    };

    const payload = JSON.stringify(embedPayload);
    console.log("[DEBUG] PAYLOAD:", payload);

    try {
        const url = new URL(webhookUrl);
        const options = {
            hostname: url.hostname,
            path: url.pathname + url.search, // Preserve query parameters if present
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        };

        const req = https.request(options, (res) => {
            console.log("[DEBUG] [DISCORD STATUS]:", res.statusCode);
            console.log("[DEBUG] [DISCORD HEADERS]:", JSON.stringify(res.headers));

            let body = "";
            res.on("data", (chunk) => {
                body += chunk;
            });

            res.on("end", () => {
                console.log("[DEBUG] [DISCORD RESPONSE BODY]:", body);
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    console.log('[DEBUG] DISCORD WEBHOOK TRIGGERED SUCCESSFULLY');
                } else {
                    console.error(`[DEBUG] DISCORD WEBHOOK FAILED WITH STATUS: ${res.statusCode}`);
                }
                console.log("[DEBUG] === WEBHOOK END ===");
            });
        });

        req.on('error', (e) => {
            console.error("[DEBUG] WEBHOOK HTTPS REQUEST ERROR:", e.message);
            console.log("[DEBUG] === WEBHOOK END ===");
        });

        req.write(payload);
        req.end();
    } catch (err) {
        console.error("[DEBUG] WEBHOOK URL PARSING ERROR:", err.message);
        console.log("[DEBUG] === WEBHOOK END ===");
    }
}

module.exports = { sendDiscordNotification };
