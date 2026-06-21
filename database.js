const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/messages.json');

function initDatabase() {
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir);
    }

    if (!fs.existsSync(DB_PATH)) {
        fs.writeFileSync(DB_PATH, JSON.stringify([]));
    }
}

function saveMessage(message) {
    try {
        const data = fs.readFileSync(DB_PATH, 'utf8');
        const messages = JSON.parse(data);
        messages.push(message);
        fs.writeFileSync(DB_PATH, JSON.stringify(messages, null, 2));
    } catch (err) {
        console.error('[DATABASE] Error saving message:', err);
    }
}

module.exports = { initDatabase, saveMessage };
