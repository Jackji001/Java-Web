import { Server } from 'socket.io';

export interface Device {
  id: string;
  name: string;
  type: string;
  location: string;
  status: 'online' | 'offline' | 'warning';
  lastUpdate: Date;
  metrics: {
    cpu: number;
    memory: number;
    temperature: number;
  };
}

const devices: Device[] = [
  { id: 'dev-001', name: '摄像机-入口A1', type: 'camera', location: '高速公路入口A1', status: 'online', lastUpdate: new Date(), metrics: { cpu: 45, memory: 62, temperature: 35 } },
  { id: 'dev-002', name: '摄像机-出口B2', type: 'camera', location: '高速公路出口B2', status: 'online', lastUpdate: new Date(), metrics: { cpu: 38, memory: 55, temperature: 33 } },
  { id: 'dev-003', name: '气象监测站-C1', type: 'weather', location: '路段C1', status: 'online', lastUpdate: new Date(), metrics: { cpu: 25, memory: 40, temperature: 28 } },
  { id: 'dev-004', name: '流量传感器-D1', type: 'sensor', location: '路段D1', status: 'warning', lastUpdate: new Date(), metrics: { cpu: 78, memory: 85, temperature: 42 } },
  { id: 'dev-005', name: '应急广播-E1', type: 'broadcast', location: '服务区E1', status: 'offline', lastUpdate: new Date(Date.now() - 300000), metrics: { cpu: 0, memory: 0, temperature: 0 } },
  { id: 'dev-006', name: '监控中心服务器', type: 'server', location: '监控中心', status: 'online', lastUpdate: new Date(), metrics: { cpu: 52, memory: 68, temperature: 38 } },
];

let ioInstance: Server | null = null;

export const deviceMonitor = {
  getAllDevices(): Device[] {
    return devices;
  },

  getDeviceById(id: string): Device | undefined {
    return devices.find(d => d.id === id);
  },

  addDevice(data: { name: string; type: string; location: string; status?: string }): Device {
    const newDevice: Device = {
      id: `dev-${Date.now()}`,
      name: data.name,
      type: data.type,
      location: data.location,
      status: (data.status as Device['status']) || 'online',
      lastUpdate: new Date(),
      metrics: { cpu: 0, memory: 0, temperature: 0 }
    };
    devices.push(newDevice);
    return newDevice;
  },

  updateDevice(id: string, data: Partial<Device>): Device | undefined {
    const index = devices.findIndex(d => d.id === id);
    if (index !== -1) {
      devices[index] = { ...devices[index], ...data, lastUpdate: new Date() };
      return devices[index];
    }
    return undefined;
  },

  removeDevice(id: string): boolean {
    const index = devices.findIndex(d => d.id === id);
    if (index !== -1) {
      devices.splice(index, 1);
      return true;
    }
    return false;
  },

  startMonitoring(io: Server) {
    ioInstance = io;
    setInterval(() => {
      devices.forEach(device => {
        if (device.status !== 'offline') {
          device.metrics.cpu = Math.floor(Math.random() * 50) + 20;
          device.metrics.memory = Math.floor(Math.random() * 40) + 40;
          device.metrics.temperature = Math.floor(Math.random() * 15) + 30;
          device.lastUpdate = new Date();

          if (device.metrics.cpu > 80 || device.metrics.temperature > 45) {
            device.status = 'warning';
          } else {
            device.status = 'online';
          }
        }
      });

      if (ioInstance) {
        ioInstance.emit('devices_update', devices);
      }
    }, 3000);
  }
};