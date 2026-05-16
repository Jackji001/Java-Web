export interface Log {
  id: string;
  type: 'info' | 'warning' | 'error' | 'alarm' | 'system';
  message: string;
  deviceId?: string;
  createdAt: Date;
}

const logs: Log[] = [
  { id: 'log-001', type: 'system', message: '系统启动', createdAt: new Date() },
  { id: 'log-002', type: 'info', message: '设备监控服务已启动', createdAt: new Date() },
  { id: 'log-003', type: 'info', message: 'WebSocket连接已建立', createdAt: new Date() },
];

export const logManager = {
  getLogs(type?: string, page: number = 1, limit: number = 10): { data: Log[]; total: number; page: number; limit: number } {
    let filtered = [...logs];
    if (type) {
      filtered = filtered.filter(l => l.type === type);
    }
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    const total = filtered.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    
    return {
      data: filtered.slice(start, end),
      total,
      page,
      limit
    };
  },

  getLogById(id: string): Log | undefined {
    return logs.find(l => l.id === id);
  },

  createLog(type: string, message: string, deviceId?: string): Log {
    const newLog: Log = {
      id: `log-${Date.now()}`,
      type: (type as Log['type']) || 'info',
      message,
      deviceId,
      createdAt: new Date()
    };
    logs.unshift(newLog);
    if (logs.length > 1000) {
      logs.pop();
    }
    return newLog;
  }
};