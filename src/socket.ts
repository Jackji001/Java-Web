import { Server, Socket } from 'socket.io';
import { deviceMonitor } from './modules/deviceMonitor';
import { alarmSystem } from './modules/alarmSystem';
import { licensePlateRecognition } from './modules/licensePlateRecognition';
import { callSystem } from './modules/callSystem';

export const initializeSocket = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log('客户端已连接:', socket.id);

    socket.emit('devices_update', deviceMonitor.getAllDevices());
    socket.emit('alarms_update', alarmSystem.getAlarms());
    socket.emit('active_calls', callSystem.getActiveCalls());

    socket.on('get_devices', () => {
      socket.emit('devices_update', deviceMonitor.getAllDevices());
    });

    socket.on('get_alarms', (params) => {
      socket.emit('alarms_update', alarmSystem.getAlarms(params?.type, params?.status));
    });

    socket.on('acknowledge_alarm', (alarmId) => {
      alarmSystem.updateAlarmStatus(alarmId, 'acknowledged');
      io.emit('alarms_update', alarmSystem.getAlarms());
    });

    socket.on('resolve_alarm', (alarmId) => {
      alarmSystem.updateAlarmStatus(alarmId, 'resolved');
      io.emit('alarms_update', alarmSystem.getAlarms());
    });

    socket.on('manual_plate_recognition', async (data) => {
      try {
        const devices = deviceMonitor.getAllDevices();
        const cameraDevices = devices.filter(d => d.type === 'camera' && d.status === 'online');
        const randomCamera = cameraDevices.length > 0 
          ? cameraDevices[Math.floor(Math.random() * cameraDevices.length)]
          : { id: 'manual', name: '手动识别' };

        const newRecord = await licensePlateRecognition.createRecord({
          deviceId: randomCamera.id,
          deviceName: randomCamera.name,
          plateNumber: data.plateNumber,
          confidence: data.confidence,
          direction: Math.random() > 0.5 ? 'in' : 'out'
        });

        io.emit('manual_plate_recognition', newRecord);
      } catch (error) {
        console.error('手动识别记录失败:', error);
      }
    });

    socket.on('make_call', (data) => {
      const { callerId, callerName, receiverId, receiverName, deviceId } = data;
      const activeCall = callSystem.makeCall(callerId, callerName, receiverId, receiverName, deviceId);
      io.emit('call_incoming', activeCall);
      io.emit('active_calls', callSystem.getActiveCalls());
    });

    socket.on('answer_call', (callId) => {
      callSystem.answerCall(callId);
      io.emit('call_answered', { callId });
      io.emit('active_calls', callSystem.getActiveCalls());
    });

    socket.on('reject_call', (callId) => {
      callSystem.rejectCall(callId);
      io.emit('call_rejected', { callId });
      io.emit('active_calls', callSystem.getActiveCalls());
    });

    socket.on('end_call', (callId) => {
      callSystem.endCall(callId);
      io.emit('call_ended', { callId });
      io.emit('active_calls', callSystem.getActiveCalls());
    });

    socket.on('disconnect', () => {
      console.log('客户端已断开连接:', socket.id);
    });
  });

  setInterval(() => {
    alarmSystem.checkDeviceAlarms();
    io.emit('alarms_update', alarmSystem.getAlarms());
  }, 5000);
};
