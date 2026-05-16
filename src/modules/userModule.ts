import bcrypt from 'bcrypt';
import { query } from '../config/database';

export interface User {
  id: string;
  username: string;
  password: string;
  email: string;
  role: 'admin' | 'operator';
  status: 'active' | 'disabled';
  createdAt: Date;
  lastLoginAt?: Date;
}

export interface RegisterData {
  username: string;
  password: string;
  email: string;
  role?: 'admin' | 'operator';
}

export interface LoginData {
  username: string;
  password: string;
}

export const userModule = {
  async initializeTable(): Promise<void> {
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(50) PRIMARY KEY,
          username VARCHAR(50) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          email VARCHAR(100) NOT NULL UNIQUE,
          role ENUM('admin', 'operator') NOT NULL DEFAULT 'operator',
          status ENUM('active', 'disabled') NOT NULL DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_login_at DATETIME,
          INDEX idx_username (username),
          INDEX idx_email (email)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      
      await this.createDefaultAdmin();
    } catch (error) {
      console.error('用户表初始化失败:', error);
      throw error;
    }
  },

  async createDefaultAdmin(): Promise<void> {
    try {
      const result = await query(`SELECT id FROM users WHERE username = 'admin'`);
      const users = result as any[];
      
      if (users.length === 0) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await query(`
          INSERT INTO users (id, username, password, email, role)
          VALUES (?, ?, ?, ?, ?)
        `, ['user-admin', 'admin', hashedPassword, 'admin@example.com', 'admin']);
        console.log('默认管理员用户已创建: admin/admin123');
      }
    } catch (error) {
      console.error('创建默认管理员失败:', error);
    }
  },

  async register(data: RegisterData): Promise<User> {
    const { username, password, email, role = 'operator' } = data;
    
    const existingUser = await query(`SELECT id FROM users WHERE username = ? OR email = ?`, [username, email]);
    const users = existingUser as any[];
    
    if (users.length > 0) {
      throw new Error('用户名或邮箱已存在');
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = `user-${Date.now()}`;
    
    await query(`
      INSERT INTO users (id, username, password, email, role)
      VALUES (?, ?, ?, ?, ?)
    `, [userId, username, hashedPassword, email, role]);
    
    return {
      id: userId,
      username,
      password: hashedPassword,
      email,
      role,
      status: 'active',
      createdAt: new Date()
    };
  },

  async login(data: LoginData): Promise<User | null> {
    const { username, password } = data;
    
    const result = await query(`SELECT * FROM users WHERE username = ?`, [username]);
    const users = result as any[];
    
    if (users.length === 0) {
      return null;
    }
    
    const user = users[0];
    
    if (user.status !== 'active') {
      return null;
    }
    
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (!passwordMatch) {
      return null;
    }
    
    await query(`UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?`, [user.id]);
    
    return {
      id: user.id,
      username: user.username,
      password: user.password,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: new Date(user.created_at),
      lastLoginAt: user.last_login_at ? new Date(user.last_login_at) : undefined
    };
  },

  async getUserById(id: string): Promise<User | null> {
    const result = await query(`SELECT * FROM users WHERE id = ?`, [id]);
    const users = result as any[];
    
    if (users.length === 0) {
      return null;
    }
    
    const user = users[0];
    return {
      id: user.id,
      username: user.username,
      password: user.password,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: new Date(user.created_at),
      lastLoginAt: user.last_login_at ? new Date(user.last_login_at) : undefined
    };
  },

  async getUserByUsername(username: string): Promise<User | null> {
    const result = await query(`SELECT * FROM users WHERE username = ?`, [username]);
    const users = result as any[];
    
    if (users.length === 0) {
      return null;
    }
    
    const user = users[0];
    return {
      id: user.id,
      username: user.username,
      password: user.password,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: new Date(user.created_at),
      lastLoginAt: user.last_login_at ? new Date(user.last_login_at) : undefined
    };
  },

  async getAllUsers(): Promise<User[]> {
    const result = await query(`SELECT * FROM users ORDER BY created_at DESC`);
    const users = result as any[];
    
    return users.map(user => ({
      id: user.id,
      username: user.username,
      password: user.password,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: new Date(user.created_at),
      lastLoginAt: user.last_login_at ? new Date(user.last_login_at) : undefined
    }));
  },

  async updateUser(id: string, data: Partial<RegisterData>): Promise<User | null> {
    const updates: string[] = [];
    const params: any[] = [];
    
    if (data.username) {
      updates.push('username = ?');
      params.push(data.username);
    }
    if (data.email) {
      updates.push('email = ?');
      params.push(data.email);
    }
    if (data.password) {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      updates.push('password = ?');
      params.push(hashedPassword);
    }
    if (data.role) {
      updates.push('role = ?');
      params.push(data.role);
    }
    
    if (updates.length === 0) {
      return await this.getUserById(id);
    }
    
    params.push(id);
    
    await query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
    
    return await this.getUserById(id);
  },

  async deleteUser(id: string): Promise<boolean> {
    const result = await query(`DELETE FROM users WHERE id = ?`, [id]);
    const deleteResult = result as any;
    return deleteResult.affectedRows > 0;
  },

  async updateUserStatus(id: string, status: 'active' | 'disabled'): Promise<boolean> {
    const result = await query(`UPDATE users SET status = ? WHERE id = ?`, [status, id]);
    const updateResult = result as any;
    return updateResult.affectedRows > 0;
  }
};
