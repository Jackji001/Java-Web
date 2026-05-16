import { query } from '../config/database';
import { LicensePlateRecord } from '../modules/licensePlateRecognition';

export class PlateDatabaseService {
  async savePlateRecord(record: LicensePlateRecord): Promise<void> {
    const sql = `
      INSERT INTO license_plate_records 
      (id, plate_number, device_id, device_name, timestamp, confidence, direction, status, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      record.id,
      record.plateNumber,
      record.deviceId,
      record.deviceName,
      record.timestamp,
      record.confidence,
      record.direction,
      record.status,
      record.imageUrl || null
    ];
    
    await query(sql, params);
  }

  async getAllRecords(): Promise<any[]> {
    const sql = `
      SELECT * FROM license_plate_records 
      ORDER BY timestamp DESC 
      LIMIT 100
    `;
    
    return await query(sql) as any[];
  }

  async getRecordById(id: string): Promise<any> {
    const sql = `SELECT * FROM license_plate_records WHERE id = ?`;
    const results = await query(sql, [id]) as any[];
    return results[0] || null;
  }

  async getRecordsByDevice(deviceId: string): Promise<any[]> {
    const sql = `
      SELECT * FROM license_plate_records 
      WHERE device_id = ? 
      ORDER BY timestamp DESC
    `;
    
    return await query(sql, [deviceId]) as any[];
  }

  async getRecordsByPlate(plateNumber: string): Promise<any[]> {
    const sql = `
      SELECT * FROM license_plate_records 
      WHERE plate_number LIKE ? 
      ORDER BY timestamp DESC
      LIMIT 50
    `;
    
    return await query(sql, [`%${plateNumber}%`]) as any[];
  }

  async getRecordsByFilters(filters: {
    deviceId?: string;
    plateNumber?: string;
    direction?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<any[]> {
    let sql = `SELECT * FROM license_plate_records WHERE 1=1`;
    const params: any[] = [];

    if (filters.deviceId) {
      sql += ` AND device_id = ?`;
      params.push(filters.deviceId);
    }

    if (filters.plateNumber) {
      sql += ` AND plate_number LIKE ?`;
      params.push(`%${filters.plateNumber}%`);
    }

    if (filters.direction) {
      sql += ` AND direction = ?`;
      params.push(filters.direction);
    }

    if (filters.status) {
      sql += ` AND status = ?`;
      params.push(filters.status);
    }

    if (filters.startDate) {
      sql += ` AND timestamp >= ?`;
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      sql += ` AND timestamp <= ?`;
      params.push(filters.endDate);
    }

    sql += ` ORDER BY timestamp DESC LIMIT 100`;

    return await query(sql, params) as any[];
  }

  async updateRecordStatus(id: string, status: string): Promise<void> {
    const sql = `
      UPDATE license_plate_records 
      SET status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    
    await query(sql, [status, id]);
  }

  async deleteRecord(id: string): Promise<void> {
    const sql = `DELETE FROM license_plate_records WHERE id = ?`;
    await query(sql, [id]);
  }

  async getStatistics(): Promise<any> {
    const sql = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN direction = 'in' THEN 1 ELSE 0 END) as in_count,
        SUM(CASE WHEN direction = 'out' THEN 1 ELSE 0 END) as out_count,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        AVG(confidence) as avg_confidence
      FROM license_plate_records
    `;
    
    const results = await query(sql) as any[];
    return results[0];
  }

  async getTodayRecords(): Promise<number> {
    const sql = `
      SELECT COUNT(*) as count 
      FROM license_plate_records 
      WHERE DATE(timestamp) = CURDATE()
    `;
    
    const results = await query(sql) as any[];
    return results[0]?.count || 0;
  }
}

export const plateDatabaseService = new PlateDatabaseService();
