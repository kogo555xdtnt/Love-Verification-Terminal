const { Server } = require('socket.io');
const { sendDiscordNotification } = require('./discord');
const { saveMessage } = require('./database');

let io;
const activeUsers = new Map();

function initSocket(server) {
    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        socket.on('user_join', (data) => {
            const userData = {
                id: socket.id,
                name: data.name || 'Visitor',
                stage: 'welcome',
                connectedAt: new Date().toISOString()
            };
            activeUsers.set(socket.id, userData);
            io.emit('admin_update_users', Array.from(activeUsers.values()));
        });

        socket.on('yes_selection', (data) => {
            // Logs cleaned up
        });

        socket.on('no_selection', (data) => {
            // Logs cleaned up
        });

        socket.on('universe_interaction', (data) => {
            // Logs cleaned up
        });

        socket.on('reveal_triggered', () => {
            const user = activeUsers.get(socket.id);
            sendDiscordNotification({
                user: user ? user.name : 'Unknown',
                event: 'FINAL REVEAL COMPLETED',
                stage: 'Final Universe',
                time: new Date().toISOString()
            });
        });

        socket.on('update_stage', (stage) => {
            const user = activeUsers.get(socket.id);
            if (user) {
                user.stage = stage;
                io.emit('admin_update_users', Array.from(activeUsers.values()));
            }
        });

        socket.on('send_message', (data) => {
            const user = activeUsers.get(socket.id);
            if (user) {
                user.name = data.name;
                const messageData = {
                    userId: socket.id,
                    name: data.name,
                    message: data.message,
                    timestamp: new Date().toISOString()
                };
                
                saveMessage(messageData);
                
                socket.emit('terminal_response', { type: 'SYSTEM', content: 'protocol accepted.' });
                io.emit('admin_new_message', messageData);
                
                sendDiscordNotification({
                    user: data.name,
                    message: data.message,
                    event: 'Sent Secret Code',
                    stage: 'Portal',
                    time: messageData.timestamp
                });
            }
        });

        socket.on('admin_approve', (userId) => {
            io.to(userId).emit('access_granted');
            const user = activeUsers.get(userId);
            sendDiscordNotification({
                user: user ? user.name : 'OPERATOR',
                event: 'APPROVED ACCESS',
                stage: 'Approved Screen',
                time: new Date().toISOString()
            });
        });

        socket.on('admin_reject', (userId) => {
            io.to(userId).emit('access_rejected', { message: 'Operator has denied progression.' });
        });

        socket.on('admin_custom_message', (data) => {
            io.to(data.userId).emit('terminal_response', { type: 'SYSTEM', content: `OPERATOR: ${data.message}` });
        });

        socket.on('disconnect', () => {
            const user = activeUsers.get(socket.id);
            if (user) {
                activeUsers.delete(socket.id);
                io.emit('admin_update_users', Array.from(activeUsers.values()));
            }
        });
    });

    return io;
}

module.exports = { initSocket };
