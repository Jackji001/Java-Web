import { logManager } from './logManager';
import { plateDatabaseService } from '../services/plateDatabaseService';

export interface LicensePlateRecord {
  id: string;
  plateNumber: string;
  deviceId: string;
  deviceName: string;
  timestamp: Date;
  confidence: number;
  imageUrl?: string;
  direction: 'in' | 'out';
  status: 'recognized' | 'pending' | 'invalid';
}

const plateRecords: LicensePlateRecord[] = [
  { id: 'plate-001', plateNumber: '京 A12345', deviceId: 'dev-001', deviceName: '摄像机 - 入口 A1', timestamp: new Date(Date.now() - 5000), confidence: 98.5, direction: 'in', status: 'recognized' },
  { id: 'plate-002', plateNumber: '京 B67890', deviceId: 'dev-001', deviceName: '摄像机 - 入口 A1', timestamp: new Date(Date.now() - 12000), confidence: 95.2, direction: 'in', status: 'recognized' },
  { id: 'plate-003', plateNumber: '京 C11111', deviceId: 'dev-002', deviceName: '摄像机 - 出口 B2', timestamp: new Date(Date.now() - 8000), confidence: 99.1, direction: 'out', status: 'recognized' },
  { id: 'plate-004', plateNumber: '京 D22222', deviceId: 'dev-002', deviceName: '摄像机 - 出口 B2', timestamp: new Date(Date.now() - 15000), confidence: 92.8, direction: 'out', status: 'recognized' },
  { id: 'plate-005', plateNumber: '京 E33333', deviceId: 'dev-001', deviceName: '摄像机 - 入口 A1', timestamp: new Date(Date.now() - 3000), confidence: 88.3, direction: 'in', status: 'pending' },
];

export const licensePlateRecognition = {
  async getAllRecords(): Promise<LicensePlateRecord[]> {
    try {
      const dbRecords = await plateDatabaseService.getAllRecords();
      return dbRecords.map(record => ({
        ...record,
        timestamp: new Date(record.timestamp),
        confidence: parseFloat(record.confidence)
      }));
    } catch (error) {
      console.error('获取所有记录失败:', error);
      return plateRecords;
    }
  },

  async getRecordById(id: string): Promise<LicensePlateRecord | null> {
    try {
      const record = await plateDatabaseService.getRecordById(id);
      if (record) {
        return {
          ...record,
          timestamp: new Date(record.timestamp),
          confidence: parseFloat(record.confidence)
        };
      }
      return null;
    } catch (error) {
      console.error('获取记录失败:', error);
      return null;
    }
  },

  async getRecordsByDevice(deviceId: string): Promise<LicensePlateRecord[]> {
    try {
      const dbRecords = await plateDatabaseService.getRecordsByDevice(deviceId);
      return dbRecords.map(record => ({
        ...record,
        timestamp: new Date(record.timestamp),
        confidence: parseFloat(record.confidence)
      }));
    } catch (error) {
      console.error('按设备获取记录失败:', error);
      return [];
    }
  },

  async getRecordsByPlate(plateNumber: string): Promise<LicensePlateRecord[]> {
    try {
      const dbRecords = await plateDatabaseService.getRecordsByPlate(plateNumber);
      return dbRecords.map(record => ({
        ...record,
        timestamp: new Date(record.timestamp),
        confidence: parseFloat(record.confidence)
      }));
    } catch (error) {
      console.error('按车牌获取记录失败:', error);
      return [];
    }
  },

  async createRecord(data: { deviceId: string; deviceName: string; plateNumber: string; confidence: number; direction: string; imageUrl?: string }): Promise<LicensePlateRecord> {
    const newRecord: LicensePlateRecord = {
      id: `plate-${Date.now()}`,
      plateNumber: data.plateNumber,
      deviceId: data.deviceId,
      deviceName: data.deviceName,
      timestamp: new Date(),
      confidence: data.confidence,
      direction: (data.direction as LicensePlateRecord['direction']) || 'in',
      status: data.confidence >= 90 ? 'recognized' : 'pending',
      imageUrl: data.imageUrl
    };
    
    plateRecords.unshift(newRecord);
    if (plateRecords.length > 100) {
      plateRecords.pop();
    }
    
    try {
      await plateDatabaseService.savePlateRecord(newRecord);
      logManager.createLog('info', `车牌识别：${data.plateNumber} (置信度：${data.confidence}%) - 已保存至数据库`, data.deviceId);
    } catch (error) {
      console.error('保存记录到数据库失败:', error);
      logManager.createLog('error', `车牌识别保存失败：${data.plateNumber}`, data.deviceId);
    }
    
    return newRecord;
  },

  async updateRecord(id: string, data: Partial<LicensePlateRecord>): Promise<LicensePlateRecord | null> {
    try {
      if (data.status) {
        await plateDatabaseService.updateRecordStatus(id, data.status);
      }
      
      const index = plateRecords.findIndex(p => p.id === id);
      if (index !== -1) {
        plateRecords[index] = { ...plateRecords[index], ...data };
        return plateRecords[index];
      }
      
      return await this.getRecordById(id);
    } catch (error) {
      console.error('更新记录失败:', error);
      return null;
    }
  },

  async removeRecord(id: string): Promise<boolean> {
    try {
      await plateDatabaseService.deleteRecord(id);
      
      const index = plateRecords.findIndex(p => p.id === id);
      if (index !== -1) {
        plateRecords.splice(index, 1);
        return true;
      }
      return false;
    } catch (error) {
      console.error('删除记录失败:', error);
      return false;
    }
  },

  async getStatistics() {
    try {
      return await plateDatabaseService.getStatistics();
    } catch (error) {
      console.error('获取统计数据失败:', error);
      return {
        total: plateRecords.length,
        in_count: plateRecords.filter(p => p.direction === 'in').length,
        out_count: plateRecords.filter(p => p.direction === 'out').length,
        pending_count: plateRecords.filter(p => p.status === 'pending').length
      };
    }
  },

  async getTodayRecords(): Promise<number> {
    try {
      return await plateDatabaseService.getTodayRecords();
    } catch (error) {
      console.error('获取今日记录失败:', error);
      return 0;
    }
  },

  async simulatePlateRecognition(deviceId: string, deviceName: string): Promise<LicensePlateRecord | null> {
    const platePrefixes = ['京', '津', '沪', '渝', '冀', '晋', '蒙', '辽', '吉', '黑', '苏', '浙', '皖', '闽', '赣', '鲁', '豫', '鄂', '湘', '粤', '桂', '琼', '川', '贵', '云', '藏', '陕', '甘', '青', '宁', '新'];
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
    
    const prefix = platePrefixes[Math.floor(Math.random() * platePrefixes.length)];
    const letter = chars[Math.floor(Math.random() * 24)];
    const numbers = Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * 10)]).join('');
    const plateNumber = `${prefix}${letter}${numbers}`;
    const confidence = Math.random() * 15 + 85;
    const direction = Math.random() > 0.5 ? 'in' : 'out';
    
    return await this.createRecord({ deviceId, deviceName, plateNumber, confidence, direction });
  }
};