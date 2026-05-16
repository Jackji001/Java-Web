import { Router } from 'express';
import deviceRoutes from './deviceRoutes';
import alarmRoutes from './alarmRoutes';
import logRoutes from './logRoutes';
import licensePlateRoutes from './licensePlateRoutes';
import callRoutes from './callRoutes';
import authRoutes from './authRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/devices', deviceRoutes);
router.use('/alarms', alarmRoutes);
router.use('/logs', logRoutes);
router.use('/license-plates', licensePlateRoutes);
router.use('/calls', callRoutes);

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
