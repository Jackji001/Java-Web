import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';
import { initializeSocket } from './socket';
import { deviceMonitor } from './modules/deviceMonitor';
import { licensePlateRecognition } from './modules/licensePlateRecognition';
import { userModule } from './modules/userModule';
import { initializeDatabase } from './config/database';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/api', routes);

initializeDatabase().then(async () => {
  console.log('数据库初始化完成');
  await userModule.initializeTable();
  console.log('用户模块初始化完成');
}).catch(err => {
  console.error('数据库初始化失败，请检查 MySQL 配置:', err);
});

initializeSocket(io);

deviceMonitor.startMonitoring(io);

setInterval(async () => {
  const devices = deviceMonitor.getAllDevices();
  const cameraDevices = devices.filter(d => d.type === 'camera' && d.status === 'online');
  if (cameraDevices.length > 0 && Math.random() > 0.3) {
    const randomCamera = cameraDevices[Math.floor(Math.random() * cameraDevices.length)];
    const newRecord = await licensePlateRecognition.simulatePlateRecognition(randomCamera.id, randomCamera.name);
    if (newRecord) {
      io.emit('plate_recognition', newRecord);
    }
  }
}, 4000);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});