import { Router } from 'express';
import { deviceMonitor } from '../modules/deviceMonitor';

const router = Router();

router.get('/', (req, res) => {
  const devices = deviceMonitor.getAllDevices();
  res.json(devices);
});

router.get('/:id', (req, res) => {
  const device = deviceMonitor.getDeviceById(req.params.id);
  if (device) {
    res.json(device);
  } else {
    res.status(404).json({ error: '设备不存在' });
  }
});

router.post('/', (req, res) => {
  const { name, type, location, status } = req.body;
  const newDevice = deviceMonitor.addDevice({ name, type, location, status });
  res.status(201).json(newDevice);
});

router.put('/:id', (req, res) => {
  const updatedDevice = deviceMonitor.updateDevice(req.params.id, req.body);
  if (updatedDevice) {
    res.json(updatedDevice);
  } else {
    res.status(404).json({ error: '设备不存在' });
  }
});

router.delete('/:id', (req, res) => {
  const success = deviceMonitor.removeDevice(req.params.id);
  if (success) {
    res.json({ message: '设备已删除' });
  } else {
    res.status(404).json({ error: '设备不存在' });
  }
});

export default router;