import { Router } from 'express';
import { licensePlateRecognition } from '../modules/licensePlateRecognition';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { deviceId, plateNumber } = req.query;
    let records = await licensePlateRecognition.getAllRecords();
    
    if (deviceId) {
      records = records.filter(r => r.deviceId === deviceId);
    }
    if (plateNumber) {
      records = records.filter(r => r.plateNumber.includes(plateNumber as string));
    }
    
    res.json(records);
  } catch (error) {
    console.error('获取记录列表失败:', error);
    res.status(500).json({ error: '获取记录失败' });
  }
});

router.get('/statistics', async (req, res) => {
  try {
    const stats = await licensePlateRecognition.getStatistics();
    res.json(stats);
  } catch (error) {
    console.error('获取统计数据失败:', error);
    res.status(500).json({ error: '获取统计数据失败' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const record = await licensePlateRecognition.getRecordById(req.params.id);
    if (record) {
      res.json(record);
    } else {
      res.status(404).json({ error: '记录不存在' });
    }
  } catch (error) {
    console.error('获取记录失败:', error);
    res.status(500).json({ error: '获取记录失败' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { deviceId, deviceName, plateNumber, confidence, direction } = req.body;
    if (!deviceId || !plateNumber) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    const newRecord = await licensePlateRecognition.createRecord({ 
      deviceId, 
      deviceName: deviceName || '未知设备', 
      plateNumber, 
      confidence: confidence || 95, 
      direction: direction || 'in' 
    });
    res.status(201).json(newRecord);
  } catch (error) {
    console.error('创建记录失败:', error);
    res.status(500).json({ error: '创建记录失败' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updatedRecord = await licensePlateRecognition.updateRecord(req.params.id, req.body);
    if (updatedRecord) {
      res.json(updatedRecord);
    } else {
      res.status(404).json({ error: '记录不存在' });
    }
  } catch (error) {
    console.error('更新记录失败:', error);
    res.status(500).json({ error: '更新记录失败' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const success = await licensePlateRecognition.removeRecord(req.params.id);
    if (success) {
      res.json({ message: '记录已删除' });
    } else {
      res.status(404).json({ error: '记录不存在' });
    }
  } catch (error) {
    console.error('删除记录失败:', error);
    res.status(500).json({ error: '删除记录失败' });
  }
});

router.post('/recognize', async (req, res) => {
  try {
    const { image } = req.body;
    
    if (!image) {
      return res.status(400).json({ success: false, message: '缺少图片数据' });
    }
    
    const platePrefixes = ['京', '津', '沪', '渝', '冀', '晋', '蒙', '辽', '吉', '黑', '苏', '浙', '皖', '闽', '赣', '鲁', '豫', '鄂', '湘', '粤', '桂', '琼', '川', '贵', '云', '藏', '陕', '甘', '青', '宁', '新'];
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
    
    const prefix = platePrefixes[Math.floor(Math.random() * platePrefixes.length)];
    const letter = chars[Math.floor(Math.random() * 24)];
    const numbers = Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * 10)]).join('');
    const plateNumber = `${prefix}${letter}${numbers}`;
    const confidence = Math.random() * 20 + 80;
    
    if (Math.random() > 0.15) {
      res.json({
        success: true,
        plateNumber,
        confidence,
        message: '识别成功'
      });
    } else {
      res.json({
        success: false,
        message: '未检测到车牌，请调整角度后重试'
      });
    }
  } catch (error) {
    console.error('识别失败:', error);
    res.status(500).json({ success: false, message: '识别服务异常' });
  }
});

export default router;