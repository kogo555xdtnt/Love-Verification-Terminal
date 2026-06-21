const socket = io();

const userList = document.getElementById('user-list');
const systemLogs = document.getElementById('system-logs');

socket.on('connect', () => {
    addLog('system', 'OPERATOR ONLINE');
});

socket.on('admin_update_users', (users) => {
    userList.innerHTML = users.length === 0 ? '<p>No users detected in sector.</p>' : '';
    users.forEach(user => {
        const card = document.createElement('div');
        card.classList.add('user-card');
        card.innerHTML = `
            <h4>${user.name}</h4>
            <p style="font-size: 0.8rem; opacity: 0.6;">UUID: ${user.id}</p>
            <p>Phase: <span style="color: #ff4fd8; font-weight: bold;">${user.stage.toUpperCase()}</span></p>
            <div class="controls">
                <button class="neon-button mini-btn" onclick="approveUser('${user.id}')">APPROVE</button>
                <button class="neon-button mini-btn secondary" onclick="rejectUser('${user.id}')">REJECT</button>
            </div>
            <div class="msg-input">
                <input type="text" id="msg-${user.id}" placeholder="Direct system message...">
                <button class="neon-button mini-btn" onclick="sendCustom('${user.id}')">SEND</button>
            </div>
        `;
        userList.appendChild(card);
    });
});

socket.on('admin_new_message', (data) => {
    // Formatted User Message Card
    const card = document.createElement('div');
    card.classList.add('message-card');
    card.innerHTML = `
        <div class="label">USER SIGNAL INTERCEPTED</div>
        <div class="label" style="font-size: 0.7rem; opacity: 0.7;">Name:</div>
        <div class="val">${data.name}</div>
        <div class="label" style="font-size: 0.7rem; opacity: 0.7;">Secret Code:</div>
        <div class="val">${data.message}</div>
        <div class="meta">${new Date().toLocaleTimeString()}</div>
    `;
    systemLogs.appendChild(card);
    systemLogs.scrollTop = systemLogs.scrollHeight;
});

function addLog(type, msg) {
    const entry = document.createElement('div');
    entry.classList.add('log-entry');
    
    if (type === 'system') {
        entry.classList.add('system-msg');
        entry.innerHTML = `[SYSTEM]: ${msg}`;
    } else if (type === 'admin') {
        entry.classList.add('admin-msg');
        entry.innerHTML = `[OPERATOR]: ${msg}`;
    }
    
    systemLogs.appendChild(entry);
    systemLogs.scrollTop = systemLogs.scrollHeight;
}

window.approveUser = (id) => {
    socket.emit('admin_approve', id);
    addLog('admin', `COMMAND: APPROVE ACCESS -> ${id}`);
};

window.rejectUser = (id) => {
    socket.emit('admin_reject', id);
    addLog('admin', `COMMAND: DENY ACCESS -> ${id}`);
};

window.sendCustom = (id) => {
    const input = document.getElementById(`msg-${id}`);
    const message = input.value.trim();
    if (message) {
        socket.emit('admin_custom_message', { userId: id, message });
        addLog('admin', `MSG TO ${id}: ${message}`);
        input.value = '';
    }
};
