import { Router } from 'express';
import { logManager } from '../modules/logManager';

const router = Router();

router.get('/', (req, res) => {
  const { type, page = 1, limit = 10 } = req.query;
  const logs = logManager.getLogs(type as string, parseInt(page as string), parseInt(limit as string));
  res.json(logs);
});

router.get('/:id', (req, res) => {
  const log = logManager.getLogById(req.params.id);
  if (log) {
    res.json(log);
  } else {
    res.status(404).json({ error: '日志不存在' });
  }
});

router.post('/', (req, res) => {
  const { type, message, deviceId } = req.body;
  const newLog = logManager.createLog(type, message, deviceId);
  res.status(201).json(newLog);
});

export default router;