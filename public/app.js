const socket = io();

let devices = [];
let alarms = [];
let logs = [];
let plateRecords = [];
let callRecords = [];
let activeCalls = [];
let currentCall = null;
let callDurationInterval = null;
let currentUser = null;
let users = [];

document.addEventListener('DOMContentLoaded', () => {
  loadCurrentUser();
});

function loadCurrentUser() {
  const storedUser = localStorage.getItem('highway_user');
  if (storedUser) {
    try {
      currentUser = JSON.parse(storedUser);
      document.getElementById('authModal').style.display = 'none';
      document.getElementById('mainContainer').style.display = 'flex';
      document.getElementById('currentUser').textContent = `当前用户: ${currentUser.username} (${currentUser.role === 'admin' ? '管理�? : '操作�?})`;
      checkUserPermissions();
      if (currentUser.role === 'admin') {
        loadUsers();
      }
    } catch (e) {
      console.error('Failed to parse stored user:', e);
      localStorage.removeItem('highway_user');
    }
  }
}

function showAuthMessage(message, type) {
  const msgEl = document.getElementById('authMessage');
  msgEl.textContent = message;
  msgEl.className = `auth-message ${type}`;
  msgEl.style.display = 'block';
  setTimeout(() => {
    msgEl.style.display = 'none';
  }, 3000);
}

async function login() {
  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;
  
  if (!username || !password) {
    showAuthMessage('请输入用户名和密�?, 'error');
    return;
  }

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      currentUser = data.user;
      localStorage.setItem('highway_user', JSON.stringify(currentUser));
      document.getElementById('authModal').style.display = 'none';
      document.getElementById('mainContainer').style.display = 'flex';
      document.getElementById('currentUser').textContent = `当前用户: ${currentUser.username} (${currentUser.role === 'admin' ? '管理�? : '操作�?})`;
      
      checkUserPermissions();
      
      if (currentUser.role === 'admin') {
        loadUsers();
      }
      
      showAuthMessage('登录成功', 'success');
    } else {
      showAuthMessage(data.message, 'error');
    }
  } catch (error) {
    showAuthMessage('登录失败，请重试', 'error');
    console.error('Login error:', error);
  }
}

async function register() {
  const username = document.getElementById('registerUsername').value;
  const password = document.getElementById('registerPassword').value;
  const email = document.getElementById('registerEmail').value;
  const role = document.getElementById('registerRole').value;
  
  if (!username || !password || !email) {
    showAuthMessage('请填写所有必填字�?, 'error');
    return;
  }

  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, email, role })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showAuthMessage('注册成功，请登录', 'success');
      switchToLogin();
    } else {
      showAuthMessage(data.message, 'error');
    }
  } catch (error) {
    showAuthMessage('注册失败，请重试', 'error');
    console.error('Register error:', error);
  }
}

function switchToLogin() {
  document.getElementById('loginForm').style.display = 'block';
  document.getElementById('registerForm').style.display = 'none';
  document.getElementById('loginTab').classList.add('active');
  document.getElementById('registerTab').classList.remove('active');
}

function switchToRegister() {
  document.getElementById('registerForm').style.display = 'block';
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('registerTab').classList.add('active');
  document.getElementById('loginTab').classList.remove('active');
}

function logout() {
  currentUser = null;
  localStorage.removeItem('highway_user');
  document.getElementById('mainContainer').style.display = 'none';
  document.getElementById('authModal').style.display = 'flex';
  document.getElementById('loginUsername').value = '';
  document.getElementById('loginPassword').value = '';
}

function checkUserPermissions() {
  const usersTab = document.querySelector('[data-tab="users"]');
  
  if (currentUser && currentUser.role === 'admin') {
    usersTab.style.display = 'block';
  } else {
    usersTab.style.display = 'none';
    
    const usersTabContent = document.getElementById('users');
    if (usersTabContent.classList.contains('active')) {
      showTab('dashboard');
    }
  }
}

async function loadUsers() {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (currentUser) {
      headers['X-User-Id'] = currentUser.id;
      headers['X-User-Username'] = currentUser.username;
      headers['X-User-Role'] = currentUser.role;
    }
    
    const response = await fetch('/api/auth/users', { headers });
    const data = await response.json();
    if (data.success) {
      users = data.data;
      renderUsersTable();
    }
  } catch (error) {
    console.error('Load users error:', error);
  }
}

function renderUsersTable() {
  const tbody = document.getElementById('usersTableBody');
  const searchTerm = document.getElementById('userSearch')?.value.toLowerCase() || '';
  
  let filtered = users;
  if (searchTerm) {
    filtered = filtered.filter(u => 
      u.username.toLowerCase().includes(searchTerm) || 
      u.email.toLowerCase().includes(searchTerm)
    );
  }

  tbody.innerHTML = filtered.map(user => `
    <tr>
      <td>${user.id}</td>
      <td>${user.username}</td>
      <td>${user.email}</td>
      <td><span class="role-${user.role}">${user.role === 'admin' ? '管理�? : '操作�?}</span></td>
      <td><span class="status-${user.status}">${user.status === 'active' ? '活跃' : '禁用'}</span></td>
      <td>${formatDate(user.createdAt)}</td>
      <td>${user.lastLoginAt ? formatDate(user.lastLoginAt) : '从未登录'}</td>
      <td>
        <button class="action-btn edit" onclick="editUser('${user.id}')">编辑</button>
        <button class="action-btn delete" onclick="deleteUser('${user.id}')">删除</button>
        <button class="action-btn status" onclick="toggleUserStatus('${user.id}', '${user.status}')">
          ${user.status === 'active' ? '禁用' : '启用'}
        </button>
      </td>
    </tr>
  `).join('');
}

function openUserModal(userId = null) {
  const modal = document.getElementById('userModal');
  const title = document.getElementById('userModalTitle');
  const form = document.getElementById('userForm');
  
  if (userId) {
    const user = users.find(u => u.id === userId);
    if (user) {
      title.textContent = '编辑用户';
      document.getElementById('userId').value = user.id;
      document.getElementById('userUsername').value = user.username;
      document.getElementById('userEmail').value = user.email;
      document.getElementById('userRole').value = user.role;
      document.getElementById('userPassword').value = '';
    }
  } else {
    title.textContent = '添加用户';
    form.reset();
    document.getElementById('userId').value = '';
  }
  
  modal.style.display = 'flex';
}

function closeUserModal() {
  document.getElementById('userModal').style.display = 'none';
}

async function saveUser(event) {
  event.preventDefault();
  
  const userId = document.getElementById('userId').value;
  const username = document.getElementById('userUsername').value;
  const password = document.getElementById('userPassword').value;
  const email = document.getElementById('userEmail').value;
  const role = document.getElementById('userRole').value;
  
  try {
    const url = userId ? `/api/auth/user/${userId}` : '/api/auth/register';
    const method = userId ? 'PUT' : 'POST';
    
    const data = { username, email, role };
    if (password) data.password = password;
    
    const headers = { 'Content-Type': 'application/json' };
    if (currentUser) {
      headers['X-User-Id'] = currentUser.id;
      headers['X-User-Username'] = currentUser.username;
      headers['X-User-Role'] = currentUser.role;
    }
    
    const response = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (result.success) {
      showAuthMessage(userId ? '用户更新成功' : '用户添加成功', 'success');
      closeUserModal();
      loadUsers();
    } else {
      showAuthMessage(result.message, 'error');
    }
  } catch (error) {
    showAuthMessage('保存失败，请重试', 'error');
    console.error('Save user error:', error);
  }
}

async function deleteUser(userId) {
  if (!confirm('确定要删除该用户吗？')) return;
  
  try {
    const headers = {};
    if (currentUser) {
      headers['X-User-Id'] = currentUser.id;
      headers['X-User-Username'] = currentUser.username;
      headers['X-User-Role'] = currentUser.role;
    }
    
    const response = await fetch(`/api/auth/user/${userId}`, {
      method: 'DELETE',
      headers
    });
    
    const data = await response.json();
    
    if (data.success) {
      showAuthMessage('删除成功', 'success');
      loadUsers();
    } else {
      showAuthMessage(data.message, 'error');
    }
  } catch (error) {
    showAuthMessage('删除失败，请重试', 'error');
    console.error('Delete user error:', error);
  }
}

async function toggleUserStatus(userId, currentStatus) {
  const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
  
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (currentUser) {
      headers['X-User-Id'] = currentUser.id;
      headers['X-User-Username'] = currentUser.username;
      headers['X-User-Role'] = currentUser.role;
    }
    
    const response = await fetch(`/api/auth/user/${userId}/status`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ status: newStatus })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showAuthMessage(`用户�?{newStatus === 'active' ? '启用' : '禁用'}`, 'success');
      loadUsers();
    } else {
      showAuthMessage(data.message, 'error');
    }
  } catch (error) {
    showAuthMessage('操作失败，请重试', 'error');
    console.error('Toggle status error:', error);
  }
}

function updateTime() {
  const now = new Date();
  document.getElementById('currentTime').textContent = now.toLocaleString('zh-CN');
}

function showTab(tabName) {
  if (tabName === 'users' && (!currentUser || currentUser.role !== 'admin')) {
    showAuthMessage('权限不足，只有管理员可以访问用户管理页面', 'error');
    return;
  }
  
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(tabName).classList.add('active');
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
}

function updateStats() {
  const totalDevices = devices.length;
  const onlineDevices = devices.filter(d => d.status === 'online').length;
  const warningDevices = devices.filter(d => d.status === 'warning').length;
  const activeAlarms = alarms.filter(a => a.status === 'active').length;

  document.getElementById('totalDevices').textContent = totalDevices;
  document.getElementById('onlineDevices').textContent = onlineDevices;
  document.getElementById('warningDevices').textContent = warningDevices;
  document.getElementById('activeAlarms').textContent = activeAlarms;
}

function renderDeviceList() {
  const container = document.getElementById('deviceList');
  const recentDevices = [...devices].slice(0, 6);
  container.innerHTML = recentDevices.map(device => `
    <div class="device-item">
      <span class="device-name">${device.name}</span>
      <span class="device-status status-${device.status}">${getStatusText(device.status)}</span>
    </div>
  `).join('');
}

function getStatusText(status) {
  const map = { online: '在线', offline: '离线', warning: '异常' };
  return map[status] || status;
}

function getLevelText(level) {
  const map = { low: '�?, medium: '�?, high: '�?, critical: '严重' };
  return map[level] || level;
}

function getStatusTextEn(status) {
  const map = { active: '活动', acknowledged: '已确�?, resolved: '已解�? };
  return map[status] || status;
}

function renderRecentAlarms() {
  const container = document.getElementById('recentAlarms');
  const recent = [...alarms].filter(a => a.status === 'active').slice(0, 5);
  container.innerHTML = recent.length > 0 ? recent.map(alarm => `
    <div class="alarm-item">
      <span class="alarm-message">${alarm.message}</span>
      <span class="alarm-level level-${alarm.level}">${getLevelText(alarm.level)}</span>
    </div>
  `).join('') : '<p style="color: #7f8c8d; text-align: center;">暂无活动告警</p>';
}

function renderDevicesTable() {
  const tbody = document.getElementById('devicesTableBody');
  const searchTerm = document.getElementById('deviceSearch').value.toLowerCase();
  const statusFilter = document.getElementById('deviceStatus').value;
  
  let filtered = devices;
  if (searchTerm) {
    filtered = filtered.filter(d => 
      d.name.toLowerCase().includes(searchTerm) || 
      d.location.toLowerCase().includes(searchTerm)
    );
  }
  if (statusFilter !== 'all') {
    filtered = filtered.filter(d => d.status === statusFilter);
  }

  tbody.innerHTML = filtered.map(device => `
    <tr>
      <td>${device.id}</td>
      <td>${device.name}</td>
      <td>${getDeviceTypeText(device.type)}</td>
      <td>${device.location}</td>
      <td><span class="device-status status-${device.status}">${getStatusText(device.status)}</span></td>
      <td>${device.metrics.cpu}%</td>
      <td>${device.metrics.memory}%</td>
      <td>${device.metrics.temperature}°C</td>
      <td>${formatDate(device.lastUpdate)}</td>
    </tr>
  `).join('');
}

function getDeviceTypeText(type) {
  const map = { camera: '摄像�?, weather: '气象监测�?, sensor: '传感�?, broadcast: '应急广�?, server: '服务�? };
  return map[type] || type;
}

function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleString('zh-CN');
}

function renderAlarmCards() {
  const container = document.getElementById('alarmCards');
  const levelFilter = document.getElementById('alarmLevel').value;
  const statusFilter = document.getElementById('alarmStatus').value;
  
  let filtered = alarms;
  if (levelFilter !== 'all') {
    filtered = filtered.filter(a => a.level === levelFilter);
  }
  if (statusFilter !== 'all') {
    filtered = filtered.filter(a => a.status === statusFilter);
  }

  container.innerHTML = filtered.length > 0 ? filtered.map(alarm => `
    <div class="alarm-card ${alarm.level}">
      <div class="alarm-card-header">
        <span class="alarm-card-title">${alarm.deviceName}</span>
        <span class="alarm-level level-${alarm.level}">${getLevelText(alarm.level)}</span>
      </div>
      <div class="alarm-card-message">${alarm.message}</div>
      <div class="alarm-card-footer">
        <span>${formatDate(alarm.createdAt)}</span>
        <div class="alarm-actions">
          ${alarm.status === 'active' ? `
            <button class="alarm-action-btn btn-ack" onclick="acknowledgeAlarm('${alarm.id}')">确认</button>
            <button class="alarm-action-btn btn-resolve" onclick="resolveAlarm('${alarm.id}')">解决</button>
          ` : `<span style="color: #bdc3c7;">${getStatusTextEn(alarm.status)}</span>`}
        </div>
      </div>
    </div>
  `).join('') : '<p style="color: #7f8c8d; text-align: center; grid-column: span 2;">暂无告警</p>';
}

function renderLogs() {
  const container = document.getElementById('logList');
  const typeFilter = document.getElementById('logType').value;
  
  let filtered = logs;
  if (typeFilter !== 'all') {
    filtered = filtered.filter(l => l.type === typeFilter);
  }

  container.innerHTML = filtered.map(log => `
    <div class="log-item">
      <span class="log-type ${log.type}">${getLogTypeText(log.type)}</span>
      <span class="log-message">${log.message}</span>
      <span class="log-time">${formatDate(log.createdAt)}</span>
    </div>
  `).join('');
}

function getLogTypeText(type) {
  const map = { info: '信息', warning: '警告', error: '错误', alarm: '告警', system: '系统' };
  return map[type] || type;
}

function updatePlateStats() {
  const totalPlates = plateRecords.length;
  const inPlates = plateRecords.filter(p => p.direction === 'in').length;
  const outPlates = plateRecords.filter(p => p.direction === 'out').length;
  const pendingPlates = plateRecords.filter(p => p.status === 'pending').length;

  document.getElementById('totalPlates').textContent = totalPlates;
  document.getElementById('inPlates').textContent = inPlates;
  document.getElementById('outPlates').textContent = outPlates;
  document.getElementById('pendingPlates').textContent = pendingPlates;
}

function renderPlatesTable() {
  const tbody = document.getElementById('platesTableBody');
  const searchTerm = document.getElementById('plateSearch').value.toUpperCase();
  const directionFilter = document.getElementById('plateDirection').value;
  
  let filtered = plateRecords;
  if (searchTerm) {
    filtered = filtered.filter(p => p.plateNumber.includes(searchTerm));
  }
  if (directionFilter !== 'all') {
    filtered = filtered.filter(p => p.direction === directionFilter);
  }

  tbody.innerHTML = filtered.map(record => `
    <tr>
      <td>${record.plateNumber}</td>
      <td>${record.deviceName}</td>
      <td><span class="direction-tag direction-${record.direction}">${record.direction === 'in' ? '入口' : '出口'}</span></td>
      <td>${record.confidence.toFixed(1)}%</td>
      <td><span class="device-status status-${record.status}">${record.status === 'recognized' ? '已识�? : record.status === 'pending' ? '待审�? : '无效'}</span></td>
      <td>${formatDate(record.timestamp)}</td>
    </tr>
  `).join('');
}

function showRealTimePlate(record) {
  const container = document.getElementById('realTimePlate');
  container.innerHTML = `
    <div class="plate-display">
      <div class="plate-text">${record.plateNumber}</div>
      <div class="plate-direction">${record.direction === 'in' ? '入口' : '出口'} | ${record.deviceName}</div>
    </div>
  `;
  
  setTimeout(() => {
    const plateDisplay = container.querySelector('.plate-display');
    if (plateDisplay) {
      plateDisplay.style.animation = 'none';
    }
  }, 500);
}

function acknowledgeAlarm(alarmId) {
  socket.emit('acknowledge_alarm', alarmId);
}

function resolveAlarm(alarmId) {
  socket.emit('resolve_alarm', alarmId);
}

function updateCallStats(stats) {
  document.getElementById('totalCalls').textContent = stats.total || 0;
  document.getElementById('todayCalls').textContent = stats.today || 0;
  document.getElementById('answeredCalls').textContent = stats.answered || 0;
  document.getElementById('missedCalls').textContent = stats.missed || 0;
}

function renderCallsTable() {
  const tbody = document.getElementById('callsTableBody');
  
  tbody.innerHTML = callRecords.length > 0 ? callRecords.map(record => `
    <tr>
      <td>${record.callerName}</td>
      <td>${record.receiverName}</td>
      <td><span class="call-type">${record.type === 'incoming' ? '来电' : record.type === 'outgoing' ? '呼出' : '未接'}</span></td>
      <td><span class="device-status status-${record.status}">${record.status === 'ended' ? '已结�? : record.status === 'missed' ? '未接�? : record.status}</span></td>
      <td>${record.duration ? formatDuration(record.duration) : '-'}</td>
      <td>${formatDate(record.startTime)}</td>
    </tr>
  `).join('') : '<tr><td colspan="6" style="text-align: center; color: #7f8c8d;">暂无通话记录</td></tr>';
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function renderActiveCall() {
  const container = document.getElementById('activeCall');
  
  if (activeCalls.length > 0) {
    const call = activeCalls[0];
    currentCall = call;
    
    const statusText = call.status === 'ringing' ? '响铃�?..' : '通话�?..';
    const duration = call.status === 'connected' ? calculateDuration(call.startTime) : '';
    
    container.innerHTML = `
      <div class="call-info">
        <div class="caller-info">
          <div class="caller-name">${call.callerName}</div>
          <div class="call-status ${call.status}">${statusText} ${duration}</div>
        </div>
        <div class="call-actions">
          ${call.status === 'ringing' ? `
            <button class="call-action-btn answer" onclick="answerCall('${call.id}')">
              <span>📞</span> 接听
            </button>
            <button class="call-action-btn reject" onclick="rejectCall('${call.id}')">
              <span>�?/span> 拒接
            </button>
          ` : `
            <button class="call-action-btn end" onclick="endCall('${call.id}')">
              <span>🔴</span> 挂断
            </button>
          `}
        </div>
      </div>
    `;
    
    if (call.status === 'ringing') {
      playRingingSound();
    }
    
    if (call.status === 'connected') {
      startDurationTimer(call.id);
    }
  } else {
    currentCall = null;
    stopDurationTimer();
    container.innerHTML = '<div class="no-call">暂无通话</div>';
  }
}

function calculateDuration(startTime) {
  const start = new Date(startTime);
  const now = new Date();
  const diff = Math.floor((now.getTime() - start.getTime()) / 1000);
  const mins = Math.floor(diff / 60);
  const secs = diff % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function startDurationTimer(callId) {
  callDurationInterval = setInterval(() => {
    if (currentCall && currentCall.id === callId) {
      const duration = calculateDuration(currentCall.startTime);
      const statusElement = document.querySelector('.call-status.connected');
      if (statusElement) {
        statusElement.textContent = `通话�?.. ${duration}`;
      }
    }
  }, 1000);
}

function stopDurationTimer() {
  if (callDurationInterval) {
    clearInterval(callDurationInterval);
    callDurationInterval = null;
  }
}

function playRingingSound() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = 800;
  oscillator.type = 'sine';
  gainNode.gain.value = 0.1;
  
  oscillator.start();
  
  setTimeout(() => {
    oscillator.stop();
  }, 2000);
}

function updateDeviceSelect() {
  const select = document.getElementById('callDevice');
  const onlineDevices = devices.filter(d => d.status === 'online');
  
  let options = '<option value="">请选择设备</option>';
  onlineDevices.forEach(device => {
    options += `<option value="${device.id}" data-name="${device.name}">${device.name}</option>`;
  });
  
  select.innerHTML = options;
}

function makeCall() {
  const deviceId = document.getElementById('callDevice').value;
  const contactName = document.getElementById('callContact').value || '未知联系�?;
  
  if (!deviceId) {
    alert('请选择设备');
    return;
  }
  
  const device = devices.find(d => d.id === deviceId);
  
  socket.emit('make_call', {
    callerId: 'operator',
    callerName: '操作�?,
    receiverId: deviceId,
    receiverName: device?.name || '未知设备',
    deviceId: deviceId
  });
  
  document.getElementById('callContact').value = '';
}

function answerCall(callId) {
  socket.emit('answer_call', callId);
}

function rejectCall(callId) {
  socket.emit('reject_call', callId);
}

function endCall(callId) {
  socket.emit('end_call', callId);
}

function simulateIncomingCall() {
  const deviceId = document.getElementById('callDevice').value || 'dev-001';
  const device = devices.find(d => d.id === deviceId);
  
  fetch('/api/calls/simulate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId, deviceName: device?.name || '测试设备' })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      console.log('模拟来电:', data.call);
    }
  });
}

socket.on('connect', () => {
  console.log('Connected to server');
});

socket.on('devices_update', (data) => {
  devices = data;
  updateStats();
  renderDeviceList();
  renderDevicesTable();
  updateDeviceSelect();
});

socket.on('alarms_update', (data) => {
  alarms = data;
  updateStats();
  renderRecentAlarms();
  renderAlarmCards();
});

socket.on('plate_recognition', (data) => {
  plateRecords.unshift(data);
  if (plateRecords.length > 50) {
    plateRecords.pop();
  }
  updatePlateStats();
  renderPlatesTable();
  showRealTimePlate(data);
});

socket.on('active_calls', (data) => {
  activeCalls = data;
  renderActiveCall();
});

socket.on('call_incoming', (data) => {
  activeCalls = [data];
  renderActiveCall();
});

socket.on('call_answered', (data) => {
  const callIndex = activeCalls.findIndex(c => c.id === data.callId);
  if (callIndex !== -1) {
    activeCalls[callIndex].status = 'connected';
    renderActiveCall();
  }
});

socket.on('call_rejected', (data) => {
  activeCalls = activeCalls.filter(c => c.id !== data.callId);
  renderActiveCall();
});

socket.on('call_ended', (data) => {
  activeCalls = activeCalls.filter(c => c.id !== data.callId);
  renderActiveCall();
});

socket.on('manual_plate_recognition', (data) => {
  plateRecords.unshift(data);
  if (plateRecords.length > 50) {
    plateRecords.pop();
  }
  updatePlateStats();
  renderPlatesTable();
  showRealTimePlate(data);
});

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    showTab(btn.dataset.tab);
    if (btn.dataset.tab === 'calls') {
      fetchCallRecords();
    }
  });
});

document.getElementById('deviceSearch').addEventListener('input', renderDevicesTable);
document.getElementById('deviceStatus').addEventListener('change', renderDevicesTable);
document.getElementById('alarmLevel').addEventListener('change', renderAlarmCards);
document.getElementById('alarmStatus').addEventListener('change', renderAlarmCards);
document.getElementById('logType').addEventListener('change', renderLogs);
document.getElementById('plateSearch').addEventListener('input', renderPlatesTable);
document.getElementById('plateDirection').addEventListener('change', renderPlatesTable);

document.getElementById('makeCallBtn').addEventListener('click', makeCall);
document.getElementById('simulateCallBtn').addEventListener('click', simulateIncomingCall);

function fetchCallRecords() {
  fetch('/api/calls')
    .then(res => res.json())
    .then(data => {
      callRecords = data;
      renderCallsTable();
    });
  
  fetch('/api/calls/statistics')
    .then(res => res.json())
    .then(data => {
      updateCallStats(data);
    });
}

fetch('/api/logs')
  .then(res => res.json())
  .then(data => {
    logs = data.data;
    renderLogs();
  });

fetch('/api/license-plates')
  .then(res => res.json())
  .then(data => {
    plateRecords = data;
    updatePlateStats();
    renderPlatesTable();
  });

setInterval(updateTime, 1000);
updateTime();

showTab('dashboard');

let stream = null;
const video = document.getElementById('cameraFeed');
const canvas = document.getElementById('cameraCanvas');
const startBtn = document.getElementById('startCamera');
const captureBtn = document.getElementById('capturePlate');
const stopBtn = document.getElementById('stopCamera');

function startCamera() {
  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    .then(mediaStream => {
      stream = mediaStream;
      video.srcObject = stream;
      startBtn.disabled = true;
      captureBtn.disabled = false;
      stopBtn.disabled = false;
      
      const videoWrapper = document.querySelector('.video-wrapper');
      if (!videoWrapper.querySelector('.license-frame')) {
        const frame = document.createElement('div');
        frame.className = 'license-frame';
        videoWrapper.appendChild(frame);
      }
    })
    .catch(err => {
      console.error('无法访问摄像�?', err);
      alert('无法访问摄像头，请检查权限设�?);
    });
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
    video.srcObject = null;
    startBtn.disabled = false;
    captureBtn.disabled = true;
    stopBtn.disabled = true;
    
    const frame = document.querySelector('.license-frame');
    if (frame) {
      frame.remove();
    }
    
    const preview = document.querySelector('.capture-preview');
    if (preview) {
      preview.remove();
    }
  }
}

function captureAndRecognize() {
  const context = canvas.getContext('2d');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  
  const imageData = canvas.toDataURL('image/png');
  
  const videoWrapper = document.querySelector('.video-wrapper');
  let preview = videoWrapper.querySelector('.capture-preview');
  if (!preview) {
    preview = document.createElement('div');
    preview.className = 'capture-preview';
    videoWrapper.appendChild(preview);
  }
  
  preview.innerHTML = `
    <h4>捕获图片</h4>
    <img src="${imageData}" alt="捕获的图�?>
    <div style="color: #3498db; margin-top: 10px;">正在识别...</div>
  `;
  
  fetch('/api/license-plates/recognize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ image: imageData })
  })
  .then(res => res.json())
  .then(result => {
    if (result.success && result.plateNumber) {
      preview.innerHTML = `
        <h4>识别成功</h4>
        <img src="${imageData}" alt="捕获的图�?>
        <div class="recognition-result">
          <span class="plate-number">${result.plateNumber}</span>
          <div style="margin-top: 5px; color: #bdc3c7;">置信�? ${result.confidence.toFixed(1)}%</div>
        </div>
      `;
      
      socket.emit('manual_plate_recognition', result);
    } else {
      preview.innerHTML = `
        <h4>识别失败</h4>
        <img src="${imageData}" alt="捕获的图�?>
        <div style="color: #e74c3c; margin-top: 10px;">${result.message || '无法识别车牌'}</div>
      `;
    }
  })
  .catch(err => {
    console.error('识别请求失败:', err);
    preview.innerHTML = `
      <h4>识别失败</h4>
      <img src="${imageData}" alt="捕获的图�?>
      <div style="color: #e74c3c; margin-top: 10px;">网络错误，请重试</div>
    `;
  });
}

startBtn.addEventListener('click', startCamera);
stopBtn.addEventListener('click', stopCamera);
captureBtn.addEventListener('click', captureAndRecognize);

document.getElementById('loginBtn').addEventListener('click', login);
document.getElementById('registerBtn').addEventListener('click', register);
document.getElementById('loginTab').addEventListener('click', switchToLogin);
document.getElementById('registerTab').addEventListener('click', switchToRegister);
document.getElementById('logoutBtn').addEventListener('click', logout);
document.getElementById('addUserBtn').addEventListener('click', () => openUserModal());
document.getElementById('closeUserModal').addEventListener('click', closeUserModal);
document.getElementById('userForm').addEventListener('submit', saveUser);
document.getElementById('userSearch')?.addEventListener('input', renderUsersTable);
