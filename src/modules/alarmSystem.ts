import { deviceMonitor } from './deviceMonitor';
import { logManager } from './logManager';

export interface Alarm {
  id: string;
  deviceId: string;
  deviceName: string;
  level: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  status: 'active' | 'acknowledged' | 'resolved';
  createdAt: Date;
  updatedAt: Date;
}

const alarms: Alarm[] = [];

export const alarmSystem = {
  getAlarms(type?: string, status?: string): Alarm[] {
    let filtered = [...alarms];
    if (type) {
      filtered = filtered.filter(a => a.level === type);
    }
    if (status) {
      filtered = filtered.filter(a => a.status === status);
    }
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getAlarmById(id: string): Alarm | undefined {
    return alarms.find(a => a.id === id);
  },

  createAlarm(deviceId: string, level: string, message: string): Alarm {
    const device = deviceMonitor.getDeviceById(deviceId);
    const newAlarm: Alarm = {
      id: `alarm-${Date.now()}`,
      deviceId,
      deviceName: device?.name || '未知设备',
      level: (level as Alarm['level']) || 'medium',
      message,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    alarms.push(newAlarm);
    logManager.createLog('alarm', `告警创建: ${message}`, deviceId);
    return newAlarm;
  },

  updateAlarmStatus(id: string, status: string): Alarm | undefined {
    const index = alarms.findIndex(a => a.id === id);
    if (index !== -1) {
      alarms[index].status = (status as Alarm['status']) || alarms[index].status;
      alarms[index].updatedAt = new Date();
      logManager.createLog('alarm', `告警状态更新: ${id} -> ${status}`, alarms[index].deviceId);
      return alarms[index];
    }
    return undefined;
  },

  removeAlarm(id: string): boolean {
    const index = alarms.findIndex(a => a.id === id);
    if (index !== -1) {
      alarms.splice(index, 1);
      return true;
    }
    return false;
  },

  checkDeviceAlarms() {
    const devices = deviceMonitor.getAllDevices();
    devices.forEach(device => {
      if (device.status === 'offline') {
        const existingAlarm = alarms.find(a => a.deviceId === device.id && a.status === 'active');
        if (!existingAlarm) {
          this.createAlarm(device.id, 'critical', `设备离线: ${device.name}`);
        }
      }
      if (device.status === 'warning') {
        const existingAlarm = alarms.find(a => a.deviceId === device.id && a.status === 'active' && a.level === 'high');
        if (!existingAlarm) {
          this.createAlarm(device.id, 'high', `设备异常: ${device.name} - CPU: ${device.metrics.cpu}% 温度: ${device.metrics.temperature}°C`);
        }
      }
    });
  }
};