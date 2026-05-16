import { Router } from 'express';
import { callSystem } from '../modules/callSystem';

const router = Router();

router.get('/', (req, res) => {
  const records = callSystem.getAllRecords();
  res.json(records);
});

router.get('/active', (req, res) => {
  const activeCalls = callSystem.getActiveCalls();
  res.json(activeCalls);
});

router.get('/statistics', (req, res) => {
  const stats = callSystem.getCallStatistics();
  res.json(stats);
});

router.get('/:id', (req, res) => {
  const record = callSystem.getCallById(req.params.id);
  if (record) {
    res.json(record);
  } else {
    res.status(404).json({ error: '通话记录不存在' });
  }
});

router.post('/call', (req, res) => {
  const { callerId, callerName, receiverId, receiverName, deviceId } = req.body;
  
  if (!callerId || !receiverId || !deviceId) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  const activeCall = callSystem.makeCall(
    callerId,
    callerName || '未知用户',
    receiverId,
    receiverName || '未知设备',
    deviceId
  );

  res.status(200).json(activeCall);
});

router.post('/answer/:id', (req, res) => {
  const success = callSystem.answerCall(req.params.id);
  if (success) {
    res.json({ success: true, message: '已接通' });
  } else {
    res.status(400).json({ success: false, message: '无法接通' });
  }
});

router.post('/reject/:id', (req, res) => {
  const success = callSystem.rejectCall(req.params.id);
  if (success) {
    res.json({ success: true, message: '已拒接' });
  } else {
    res.status(400).json({ success: false, message: '操作失败' });
  }
});

router.post('/end/:id', (req, res) => {
  const success = callSystem.endCall(req.params.id);
  if (success) {
    res.json({ success: true, message: '已挂断' });
  } else {
    res.status(400).json({ success: false, message: '操作失败' });
  }
});

router.post('/simulate', (req, res) => {
  const { deviceId, deviceName } = req.body;
  if (!deviceId) {
    return res.status(400).json({ error: '缺少设备ID' });
  }
  
  const activeCall = callSystem.simulateIncomingCall(deviceId, deviceName || '未知设备');
  if (activeCall) {
    res.json({ success: true, call: activeCall });
  } else {
    res.status(500).json({ success: false, message: '模拟来电失败' });
  }
});

export default router;
