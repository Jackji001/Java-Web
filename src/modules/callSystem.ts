import { logManager } from './logManager';

export interface CallRecord {
  id: string;
  callerId: string;
  callerName: string;
  receiverId: string;
  receiverName: string;
  type: 'incoming' | 'outgoing' | 'missed';
  status: 'ringing' | 'connected' | 'ended' | 'missed';
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  deviceId: string;
}

export interface ActiveCall {
  id: string;
  callerId: string;
  callerName: string;
  receiverId: string;
  receiverName: string;
  startTime: Date;
  status: 'ringing' | 'connected';
  deviceId: string;
}

const callRecords: CallRecord[] = [];
const activeCalls: ActiveCall[] = [];

export const callSystem = {
  getAllRecords(): CallRecord[] {
    return callRecords.sort((a, b) => new Date(b.startTime || 0).getTime() - new Date(a.startTime || 0).getTime());
  },

  getActiveCalls(): ActiveCall[] {
    return activeCalls;
  },

  getCallById(id: string): CallRecord | undefined {
    return callRecords.find(c => c.id === id);
  },

  getActiveCallByDevice(deviceId: string): ActiveCall | undefined {
    return activeCalls.find(c => c.deviceId === deviceId);
  },

  makeCall(callerId: string, callerName: string, receiverId: string, receiverName: string, deviceId: string): ActiveCall {
    const activeCall: ActiveCall = {
      id: `call-${Date.now()}`,
      callerId,
      callerName,
      receiverId,
      receiverName,
      startTime: new Date(),
      status: 'ringing',
      deviceId
    };

    activeCalls.push(activeCall);
    logManager.createLog('info', `发起呼叫: ${callerName} -> ${receiverName}`, deviceId);

    setTimeout(() => {
      const callIndex = activeCalls.findIndex(c => c.id === activeCall.id);
      if (callIndex !== -1 && activeCalls[callIndex].status === 'ringing') {
        activeCalls[callIndex].status = 'connected';
        
        setTimeout(() => {
          this.endCall(activeCall.id);
        }, 10000 + Math.random() * 20000);
      }
    }, 2000 + Math.random() * 3000);

    return activeCall;
  },

  answerCall(callId: string): boolean {
    const callIndex = activeCalls.findIndex(c => c.id === callId);
    if (callIndex !== -1 && activeCalls[callIndex].status === 'ringing') {
      activeCalls[callIndex].status = 'connected';
      logManager.createLog('info', `接通呼叫: ${activeCalls[callIndex].callerName}`, activeCalls[callIndex].deviceId);
      return true;
    }
    return false;
  },

  rejectCall(callId: string): boolean {
    const callIndex = activeCalls.findIndex(c => c.id === callId);
    if (callIndex !== -1) {
      const call = activeCalls[callIndex];
      const record: CallRecord = {
        id: call.id,
        callerId: call.callerId,
        callerName: call.callerName,
        receiverId: call.receiverId,
        receiverName: call.receiverName,
        type: 'incoming',
        status: 'missed',
        startTime: call.startTime,
        endTime: new Date(),
        duration: 0,
        deviceId: call.deviceId
      };
      callRecords.unshift(record);
      if (callRecords.length > 100) callRecords.pop();
      
      activeCalls.splice(callIndex, 1);
      logManager.createLog('info', `拒接呼叫: ${call.callerName}`, call.deviceId);
      return true;
    }
    return false;
  },

  endCall(callId: string): boolean {
    const callIndex = activeCalls.findIndex(c => c.id === callId);
    if (callIndex !== -1) {
      const call = activeCalls[callIndex];
      const endTime = new Date();
      const duration = Math.floor((endTime.getTime() - call.startTime.getTime()) / 1000);
      
      const record: CallRecord = {
        id: call.id,
        callerId: call.callerId,
        callerName: call.callerName,
        receiverId: call.receiverId,
        receiverName: call.receiverName,
        type: 'outgoing',
        status: call.status === 'ringing' ? 'missed' : 'ended',
        startTime: call.startTime,
        endTime,
        duration,
        deviceId: call.deviceId
      };
      
      callRecords.unshift(record);
      if (callRecords.length > 100) callRecords.pop();
      
      activeCalls.splice(callIndex, 1);
      logManager.createLog('info', `结束呼叫: ${call.callerName} - 时长: ${duration}秒`, call.deviceId);
      return true;
    }
    return false;
  },

  simulateIncomingCall(deviceId: string, deviceName: string): ActiveCall | null {
    const operators = ['张三', '李四', '王五', '赵六'];
    const operatorName = operators[Math.floor(Math.random() * operators.length)];
    
    const activeCall: ActiveCall = {
      id: `call-${Date.now()}`,
      callerId: `operator-${Date.now()}`,
      callerName: operatorName,
      receiverId: deviceId,
      receiverName: deviceName,
      startTime: new Date(),
      status: 'ringing',
      deviceId
    };

    activeCalls.push(activeCall);
    logManager.createLog('info', `收到来电: ${operatorName}`, deviceId);
    
    setTimeout(() => {
      const callIndex = activeCalls.findIndex(c => c.id === activeCall.id);
      if (callIndex !== -1 && activeCalls[callIndex].status === 'ringing') {
        this.rejectCall(activeCall.id);
      }
    }, 15000);

    return activeCall;
  },

  getCallStatistics() {
    const total = callRecords.length;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayCalls = callRecords.filter(c => new Date(c.startTime || 0) >= today);
    const answered = callRecords.filter(c => c.status === 'ended');
    const missed = callRecords.filter(c => c.status === 'missed');
    const avgDuration = answered.length > 0 
      ? Math.round(answered.reduce((sum, c) => sum + (c.duration || 0), 0) / answered.length)
      : 0;

    return {
      total,
      today: todayCalls.length,
      answered: answered.length,
      missed: missed.length,
      avgDuration
    };
  }
};
