// WebSocket handler for device-to-device transfers
// This handles the main transfer WebSocket connection

const sessions = new Map(); // deviceId -> socket
const sessionToDevice = new Map(); // socketId -> deviceId
const deviceMetadata = new Map(); // deviceId -> metadata

export const handleTransferConnection = (io) => {
  const transferNamespace = io.of('/transfer');

  transferNamespace.on('connection', (socket) => {
    console.log(`📡 Transfer connection established: ${socket.id}`);

    // Handle device registration
    socket.on('REGISTER', (data) => {
      try {
        const { deviceId, name, type = 'DESKTOP', icon = 'laptop' } = data;

        if (!deviceId) {
          socket.emit('ERROR', { message: 'deviceId is required' });
          return;
        }

        sessions.set(deviceId, socket);
        sessionToDevice.set(socket.id, deviceId);

        // Store device metadata
        deviceMetadata.set(deviceId, {
          deviceId,
          name: name || 'Unknown Device',
          type,
          icon
        });

        console.log(`✅ Registered device: ${deviceId} (name: ${name}, sessionId: ${socket.id})`);

        // Send acknowledgment
        socket.emit('REGISTERED', { status: 'OK' });
      } catch (error) {
        console.error('Registration error:', error);
        socket.emit('ERROR', { message: 'Registration failed' });
      }
    });

    // Handle transfer handshake messages (Signalling ONLY)
    socket.on('TRANSFER_REQUEST', (data) => {
      console.log(`📨 TRANSFER_REQUEST signalling from ${sessionToDevice.get(socket.id)} to ${data.targetId}`);
      forwardMessage(socket, data, 'TRANSFER_REQUEST');
    });

    socket.on('TRANSFER_RESPONSE', (data) => {
      console.log(`📨 TRANSFER_RESPONSE signalling from ${sessionToDevice.get(socket.id)} to ${data.targetId}`);
      forwardMessage(socket, data, 'TRANSFER_RESPONSE');
    });

    socket.on('TRANSFER_FINISH', (data) => {
      console.log(`📨 TRANSFER_FINISH signalling from ${sessionToDevice.get(socket.id)} to ${data.targetId}`);
      forwardMessage(socket, data, 'TRANSFER_FINISH');
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      const deviceId = sessionToDevice.get(socket.id);
      if (deviceId) {
        sessions.delete(deviceId);
        sessionToDevice.delete(socket.id);
        deviceMetadata.delete(deviceId);
        console.log(`🔌 Device disconnected: ${deviceId}`);
      }
    });
  });

  return transferNamespace;
};

const forwardMessage = (socket, data, messageType) => {
  const { targetId, transferId } = data;

  if (!targetId) {
    console.warn(`⚠️ Missing targetId in ${messageType} message`);
    socket.emit('ERROR', { message: 'targetId is required' });
    return;
  }

  const targetSocket = sessions.get(targetId);

  if (targetSocket && targetSocket.connected) {
    // Forward the message
    targetSocket.emit(messageType, data);
    console.log(`📤 Forwarded signalling ${messageType} to ${targetId} (transfer: ${transferId})`);
  } else {
    console.warn(`❌ Target device ${targetId} not found or disconnected`);
    socket.emit('ERROR', { message: 'Target device offline' });
  }
};

export const getRegisteredDevices = () => {
  return Array.from(deviceMetadata.values());
};
