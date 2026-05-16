import { Router } from 'express';
import { userModule } from '../modules/userModule';
import { checkAdmin } from '../middleware/auth';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { username, password, email, role } = req.body;
    
    if (!username || !password || !email) {
      return res.status(400).json({ success: false, message: '缺少必要参数' });
    }
    
    const user = await userModule.register({ username, password, email, role });
    
    res.status(201).json({
      success: true,
      message: '注册成功',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ success: false, message: '缺少用户名或密码' });
    }
    
    const user = await userModule.login({ username, password });
    
    if (!user) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }
    
    res.json({
      success: true,
      message: '登录成功',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        lastLoginAt: user.lastLoginAt
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: '登录失败' });
  }
});

router.post('/logout', (req, res) => {
  res.json({ success: true, message: '退出成功' });
});

router.get('/users', checkAdmin, async (req, res) => {
  try {
    const users = await userModule.getAllUsers();
    
    const userList = users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt
    }));
    
    res.json({ success: true, data: userList });
  } catch (error: any) {
    res.status(500).json({ success: false, message: '获取用户列表失败' });
  }
});

router.get('/user/:id', checkAdmin, async (req, res) => {
  try {
    const user = await userModule.getUserById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: '获取用户信息失败' });
  }
});

router.put('/user/:id', checkAdmin, async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const updated = await userModule.updateUser(req.params.id, { username, email, password, role });
    
    if (!updated) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    
    res.json({
      success: true,
      user: {
        id: updated.id,
        username: updated.username,
        email: updated.email,
        role: updated.role,
        status: updated.status
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: '更新用户失败' });
  }
});

router.delete('/user/:id', checkAdmin, async (req, res) => {
  try {
    const success = await userModule.deleteUser(req.params.id);
    
    if (!success) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    
    res.json({ success: true, message: '删除成功' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: '删除失败' });
  }
});

router.post('/user/:id/status', checkAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (status !== 'active' && status !== 'disabled') {
      return res.status(400).json({ success: false, message: '无效的状态值' });
    }
    
    const success = await userModule.updateUserStatus(req.params.id, status);
    
    if (!success) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    
    res.json({ success: true, message: '状态更新成功' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: '更新失败' });
  }
});

export default router;
