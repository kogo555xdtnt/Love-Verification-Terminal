const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
require('dotenv').config({ path: path.join(__dirname, '../.env/.env') });

const { initSocket } = require('./socket');
const { initDatabase } = require('./database');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, '../client')));
app.use('/admin', express.static(path.join(__dirname, '../admin')));

// Initialize Database
initDatabase();

// Initialize Socket.IO
initSocket(server);

// Diagnostic test route for Discord integration
app.get('/test-discord', (req, res) => {
    const { sendDiscordNotification } = require('./discord');
    console.log("[DEBUG] Triggering direct test webhook from /test-discord route...");
    sendDiscordNotification({
        user: 'TEST_USER',
        event: 'TEST_EVENT',
        stage: 'Test Stage',
        message: 'Love Engine Test Message'
    });
    res.json({ success: true, message: 'Test notification triggered. Please check the node server console log for status/response details.' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`[LOVE ENGINE] Server running on port ${PORT}`);
    console.log(`[LOVE ENGINE] User Portal: http://localhost:${PORT}`);
    console.log(`[LOVE ENGINE] Admin Dashboard: http://localhost:${PORT}/admin/dashboard.html`);
    console.log("[DEBUG] WEBHOOK URL:", process.env.DISCORD_WEBHOOK_URL);
});
