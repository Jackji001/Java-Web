import { Router } from 'express';
import { alarmSystem } from '../modules/alarmSystem';

const router = Router();

router.get('/', (req, res) => {
  const { type, status } = req.query;
  const alarms = alarmSystem.getAlarms(type as string, status as string);
  res.json(alarms);
});

router.get('/:id', (req, res) => {
  const alarm = alarmSystem.getAlarmById(req.params.id);
  if (alarm) {
    res.json(alarm);
  } else {
    res.status(404).json({ error: '告警不存在' });
  }
});

router.post('/', (req, res) => {
  const { deviceId, level, message } = req.body;
  const newAlarm = alarmSystem.createAlarm(deviceId, level, message);
  res.status(201).json(newAlarm);
});

router.put('/:id', (req, res) => {
  const { status } = req.body;
  const updatedAlarm = alarmSystem.updateAlarmStatus(req.params.id, status);
  if (updatedAlarm) {
    res.json(updatedAlarm);
  } else {
    res.status(404).json({ error: '告警不存在' });
  }
});

router.delete('/:id', (req, res) => {
  const success = alarmSystem.removeAlarm(req.params.id);
  if (success) {
    res.json({ message: '告警已删除' });
  } else {
    res.status(404).json({ error: '告警不存在' });
  }
});

export default router;