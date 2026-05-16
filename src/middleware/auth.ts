import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: string;
  };
}

export function checkAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  const userRole = req.headers['x-user-role'] as string;
  
  if (!userRole || userRole !== 'admin') {
    return res.status(403).json({ success: false, message: '权限不足，只有管理员可以执行此操作' });
  }
  
  req.user = {
    id: req.headers['x-user-id'] as string,
    username: req.headers['x-user-username'] as string,
    role: userRole
  };
  
  next();
}
