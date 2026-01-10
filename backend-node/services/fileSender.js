import fs from 'fs';
import path from 'path';
import http from 'http';
import { EventEmitter } from 'events';

/**
 * File Sender - Sends files to other devices over HTTP
 * Supports streaming and progress tracking
 */
class FileSender extends EventEmitter {
  /**
   * Send a file to a target device
   * @param {string} filePath Local path to the file
   * @param {Object} targetDevice Device info from mDNS browser
   * @param {string} pairingCode Pairing code from target device
   * @param {string} senderDeviceId This device's ID
   * @returns {Promise<Object>} Response from target device
   */
  async sendFile(filePath, targetDevice, pairingCode, senderDeviceId) {
    return new Promise((resolve, reject) => {
      if (!fs.existsSync(filePath)) {
        reject(new Error('File not found'));
        return;
      }

      const stats = fs.statSync(filePath);
      const fileSize = stats.size;
      let bytesSent = 0;

      const filename = path.basename(filePath);
      const boundary = `----FormDataBoundary${Date.now()}`;
      const fileStream = fs.createReadStream(filePath);

      // Build multipart form data manually for streaming
      const CRLF = '\r\n';
      let formDataStart = `--${boundary}${CRLF}`;
      formDataStart += `Content-Disposition: form-data; name="file"; filename="${filename}"${CRLF}`;
      formDataStart += `Content-Type: application/octet-stream${CRLF}${CRLF}`;
      const formDataEnd = `${CRLF}--${boundary}--${CRLF}`;

      const contentLength = Buffer.byteLength(formDataStart) + fileSize + Buffer.byteLength(formDataEnd);

      // Create HTTP request
      const options = {
        hostname: targetDevice.ip,
        port: targetDevice.port,
        path: '/upload',
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': contentLength,
          'X-Device-Id': targetDevice.deviceId,
          'X-Pairing-Code': pairingCode,
          'X-Sender-Device-Id': senderDeviceId
        }
      };

      const req = http.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk.toString();
        });

        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const data = JSON.parse(responseData);
              this.emit('complete', { filePath, targetDevice, data });
              resolve(data);
            } catch (e) {
              this.emit('complete', { filePath, targetDevice, data: responseData });
              resolve({ status: 'success', message: responseData });
            }
          } else {
            const error = new Error(`HTTP ${res.statusCode}: ${responseData}`);
            this.emit('error', { filePath, targetDevice, error });
            reject(error);
          }
        });
      });

      req.on('error', (error) => {
        this.emit('error', { filePath, targetDevice, error });
        reject(error);
      });

      // Write form data start
      req.write(formDataStart);

      // Stream file data and track progress
      fileStream.on('data', (chunk) => {
        bytesSent += chunk.length;
        const progress = (bytesSent / fileSize) * 100;
        this.emit('progress', {
          filePath,
          targetDevice,
          bytesSent,
          totalBytes: fileSize,
          progress: Math.min(100, progress)
        });
        req.write(chunk);
      });

      fileStream.on('end', () => {
        req.write(formDataEnd);
        req.end();
      });

      fileStream.on('error', (error) => {
        req.destroy();
        this.emit('error', { filePath, targetDevice, error });
        reject(error);
      });

      // Store request for cancellation
      this._currentRequest = { req, filePath, targetDevice };
    });
  }

  /**
   * Cancel current transfer
   */
  cancel() {
    if (this._currentRequest) {
      this._currentRequest.req.destroy();
      this.emit('cancelled', {
        filePath: this._currentRequest.filePath,
        targetDevice: this._currentRequest.targetDevice
      });
      this._currentRequest = null;
    }
  }
}

// Export singleton instance
const fileSender = new FileSender();
export default fileSender;
