class P2PFileShare {
    constructor() {
        this.isHost = false;
        this.peerConnection = null;
        this.dataChannel = null;
        this.fileData = null;
        this.currentFile = null;
        this.shareCode = null;
        this.receivedChunks = [];
        this.totalChunks = 0;
        this.receivedSize = 0;
        this.totalSize = 0;
        this.startTime = null;
        
        // Chunk size for file transfer (16KB)
        this.chunkSize = 16384;
        
        this.initializeElements();
        this.attachEventListeners();
        this.initializeServiceWorker();
        this.generateManifest();
    }

    initializeElements() {
        // Mode buttons
        this.sendModeBtn = document.getElementById('send-mode-btn');
        this.receiveModeBtn = document.getElementById('receive-mode-btn');
        
        // Panels
        this.sendMode = document.getElementById('send-mode');
        this.receiveMode = document.getElementById('receive-mode');
        
        // File input
        this.dropZone = document.getElementById('drop-zone');
        this.fileInput = document.getElementById('file-input');
        this.fileSelectBtn = document.getElementById('file-select-btn');
        
        // File info
        this.fileInfo = document.getElementById('file-info');
        this.fileName = document.getElementById('file-name');
        this.fileSize = document.getElementById('file-size');
        this.generateCodeBtn = document.getElementById('generate-code-btn');
        this.removeFileBtn = document.getElementById('remove-file');
        
        // Share info
        this.shareInfo = document.getElementById('share-info');
        this.shareCodeElement = document.getElementById('share-code');
        this.copyCodeBtn = document.getElementById('copy-code-btn');
        this.qrCanvas = document.getElementById('qr-canvas');
        
        // Progress
        this.transferProgress = document.getElementById('transfer-progress');
        this.progressFill = document.getElementById('progress-fill');
        this.progressPercentage = document.getElementById('progress-percentage');
        this.transferSpeed = document.getElementById('transfer-speed');
        
        // Receive mode
        this.codeInput = document.getElementById('code-input');
        this.connectBtn = document.getElementById('connect-btn');
        this.connectionInfo = document.getElementById('connection-info');
        this.connectionMessage = document.getElementById('connection-message');
        this.codeValid = document.getElementById('code-valid');
        
        // Download info
        this.downloadInfo = document.getElementById('download-info');
        this.incomingFileName = document.getElementById('incoming-file-name');
        this.incomingFileSize = document.getElementById('incoming-file-size');
        this.acceptFileBtn = document.getElementById('accept-file-btn');
        this.rejectFileBtn = document.getElementById('reject-file-btn');
        
        // Download progress
        this.downloadProgress = document.getElementById('download-progress');
        this.downloadProgressFill = document.getElementById('download-progress-fill');
        this.downloadPercentage = document.getElementById('download-percentage');
        this.downloadSpeed = document.getElementById('download-speed');
        
        // Notifications
        this.errorNotification = document.getElementById('error-notification');
        this.errorText = document.getElementById('error-text');
        this.closeError = document.getElementById('close-error');
        this.successNotification = document.getElementById('success-notification');
        this.successText = document.getElementById('success-text');
        this.closeSuccess = document.getElementById('close-success');
        
        // Status
        this.connectionStatus = document.getElementById('connection-status');
        this.connectionDot = document.getElementById('connection-dot');
        this.peerCount = document.getElementById('peer-count');
        
        // Reset
        this.resetBtn = document.getElementById('reset-btn');
        
        // QR Scanner
        this.scanQrBtn = document.getElementById('scan-qr-btn');
        this.qrScanner = document.getElementById('qr-scanner');
        this.closeScannerBtn = document.getElementById('close-scanner');
        this.toggleCameraBtn = document.getElementById('toggle-camera');
        this.qrVideo = document.getElementById('qr-video');
        this.qrCanvasScanner = document.getElementById('qr-canvas-scanner');
        this.scannerStatusText = document.getElementById('scanner-status-text');
        
        // Scanner state
        this.currentStream = null;
        this.cameras = [];
        this.currentCameraIndex = 0;
        this.scannerActive = false;
    }

    attachEventListeners() {
        // Mode selection
        this.sendModeBtn.addEventListener('click', () => this.showSendMode());
        this.receiveModeBtn.addEventListener('click', () => this.showReceiveMode());
        
        // File selection
        this.fileSelectBtn.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e.target.files[0]));
        
        // Remove file
        if (this.removeFileBtn) {
            this.removeFileBtn.addEventListener('click', () => this.removeFile());
        }
        
        // Drag and drop
        this.dropZone.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.dropZone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.dropZone.addEventListener('drop', (e) => this.handleDrop(e));
        
        // Generate code
        this.generateCodeBtn.addEventListener('click', () => this.generateShareCode());
        
        // Copy code
        this.copyCodeBtn.addEventListener('click', () => this.copyShareCode());
        
        // Connect
        this.connectBtn.addEventListener('click', () => this.connectToPeer());
        this.codeInput.addEventListener('input', (e) => this.handleCodeInput(e));
        
        // File transfer
        this.acceptFileBtn.addEventListener('click', () => this.acceptFile());
        this.rejectFileBtn.addEventListener('click', () => this.rejectFile());
        
        // Notifications
        this.closeError.addEventListener('click', () => this.hideError());
        this.closeSuccess.addEventListener('click', () => this.hideSuccess());
        
        // Reset
        this.resetBtn.addEventListener('click', () => this.reset());
        
        // QR Scanner
        this.scanQrBtn.addEventListener('click', () => this.openQRScanner());
        this.closeScannerBtn.addEventListener('click', () => this.closeQRScanner());
        this.toggleCameraBtn.addEventListener('click', () => this.toggleCamera());
        
        // Listen for storage changes (for peer coordination)
        window.addEventListener('storage', (e) => this.handleStorageChange(e));
    }

    showSendMode() {
        this.sendModeBtn.classList.add('active');
        this.receiveModeBtn.classList.remove('active');
        this.sendMode.classList.remove('hidden');
        this.receiveMode.classList.add('hidden');
        this.isHost = true;
        this.updateConnectionStatus('ready');
    }

    showReceiveMode() {
        this.receiveModeBtn.classList.add('active');
        this.sendModeBtn.classList.remove('active');
        this.receiveMode.classList.remove('hidden');
        this.sendMode.classList.add('hidden');
        this.isHost = false;
        this.updateConnectionStatus('ready');
    }

    handleFileSelect(file) {
        if (!file) return;
        
        this.currentFile = file;
        this.fileName.textContent = file.name;
        this.fileSize.textContent = this.formatFileSize(file.size);
        this.fileInfo.classList.remove('hidden');
        
        // Update file icon based on type
        this.updateFileIcon(file);
        
        // Read file data
        const reader = new FileReader();
        reader.onload = (e) => {
            this.fileData = e.target.result;
        };
        reader.readAsArrayBuffer(file);
        
        this.showSuccess('File selected successfully');
    }

    updateFileIcon(file) {
        const fileIcon = document.querySelector('.file-icon');
        if (!fileIcon) return;
        
        const type = file.type;
        let iconClass = 'fas fa-file-alt';
        
        if (type.startsWith('image/')) iconClass = 'fas fa-file-image';
        else if (type.startsWith('video/')) iconClass = 'fas fa-file-video';
        else if (type.startsWith('audio/')) iconClass = 'fas fa-file-audio';
        else if (type.includes('pdf')) iconClass = 'fas fa-file-pdf';
        else if (type.includes('zip') || type.includes('archive')) iconClass = 'fas fa-file-archive';
        else if (type.includes('text') || type.includes('code')) iconClass = 'fas fa-file-code';
        
        fileIcon.className = `file-icon ${iconClass}`;
    }

    removeFile() {
        this.currentFile = null;
        this.fileData = null;
        this.fileInfo.classList.add('hidden');
        this.shareInfo.classList.add('hidden');
        this.fileInput.value = '';
        this.showSuccess('File removed');
    }

    handleDragOver(e) {
        e.preventDefault();
        this.dropZone.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.dropZone.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        this.dropZone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.handleFileSelect(files[0]);
        }
    }

    generateShareCode() {
        this.shareCode = Math.random().toString(36).substr(2, 6).toUpperCase();
        this.shareCodeElement.textContent = this.shareCode;
        this.shareInfo.classList.remove('hidden');
        
        // Generate QR code
        this.generateQRCode();
        
        // Store connection info for peer discovery
        const connectionData = {
            code: this.shareCode,
            isHost: true,
            timestamp: Date.now(),
            fileName: this.currentFile.name,
            fileSize: this.currentFile.size
        };
        
        localStorage.setItem('p2p_connection_' + this.shareCode, JSON.stringify(connectionData));
        
        // Initialize WebRTC as host
        this.initializeWebRTC(true);
        
        this.showSuccess('Share code generated! Waiting for connection...');
    }

    generateQRCode() {
        const canvas = this.qrCanvas;
        const ctx = canvas.getContext('2d');
        
        // QR code size
        const size = 160;
        canvas.width = size;
        canvas.height = size;
        
        // Clear canvas
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);
        
        // Generate QR code data (simplified version)
        // In a real implementation, you'd use qrcode.js library
        this.generateSimpleQRPattern(ctx, this.shareCode, size);
        
        // Store QR data for scanning
        localStorage.setItem('qr_code_' + this.shareCode, JSON.stringify({
            code: this.shareCode,
            timestamp: Date.now(),
            url: window.location.href
        }));
    }

    generateSimpleQRPattern(ctx, data, size) {
        const moduleSize = Math.floor(size / 25); // 25x25 grid
        const modules = this.createQRMatrix(data, 25);
        
        ctx.fillStyle = '#000000';
        
        for (let row = 0; row < modules.length; row++) {
            for (let col = 0; col < modules[row].length; col++) {
                if (modules[row][col]) {
                    ctx.fillRect(
                        col * moduleSize,
                        row * moduleSize,
                        moduleSize,
                        moduleSize
                    );
                }
            }
        }
        
        // Add positioning markers (corners)
        this.drawPositioningMarker(ctx, 0, 0, moduleSize);
        this.drawPositioningMarker(ctx, 18 * moduleSize, 0, moduleSize);
        this.drawPositioningMarker(ctx, 0, 18 * moduleSize, moduleSize);
    }

    createQRMatrix(data, size) {
        const matrix = Array(size).fill().map(() => Array(size).fill(false));
        
        // Add positioning patterns
        this.addPositioningPattern(matrix, 0, 0);
        this.addPositioningPattern(matrix, size - 7, 0);
        this.addPositioningPattern(matrix, 0, size - 7);
        
        // Add data pattern based on share code
        const codeHash = this.hashCode(data);
        for (let i = 8; i < size - 8; i++) {
            for (let j = 8; j < size - 8; j++) {
                matrix[i][j] = ((codeHash + i * j) % 3) === 0;
            }
        }
        
        return matrix;
    }

    addPositioningPattern(matrix, startRow, startCol) {
        for (let i = 0; i < 7; i++) {
            for (let j = 0; j < 7; j++) {
                const row = startRow + i;
                const col = startCol + j;
                if (row < matrix.length && col < matrix[0].length) {
                    matrix[row][col] = 
                        (i === 0 || i === 6 || j === 0 || j === 6) ||
                        (i >= 2 && i <= 4 && j >= 2 && j <= 4);
                }
            }
        }
    }

    drawPositioningMarker(ctx, x, y, moduleSize) {
        const markerSize = moduleSize * 7;
        
        // Outer border
        ctx.fillStyle = '#000000';
        ctx.fillRect(x, y, markerSize, markerSize);
        
        // Inner white
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + moduleSize, y + moduleSize, markerSize - 2 * moduleSize, markerSize - 2 * moduleSize);
        
        // Center dot
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + 2 * moduleSize, y + 2 * moduleSize, 3 * moduleSize, 3 * moduleSize);
    }

    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }

    copyShareCode() {
        navigator.clipboard.writeText(this.shareCode).then(() => {
            this.showSuccess('Code copied to clipboard!');
        }).catch(() => {
            this.showError('Could not copy code');
        });
    }

    handleCodeInput(e) {
        const value = e.target.value.toUpperCase();
        e.target.value = value;
        
        if (value.length === 6) {
            this.connectBtn.disabled = false;
            this.codeValid.parentElement.classList.add('valid');
        } else {
            this.connectBtn.disabled = true;
            this.codeValid.parentElement.classList.remove('valid');
        }
    }

    connectToPeer() {
        const code = this.codeInput.value.toUpperCase();
        if (code.length !== 6) {
            this.showError('Please enter a valid 6-digit code');
            return;
        }
        
        // Look for host connection data
        const connectionData = localStorage.getItem('p2p_connection_' + code);
        if (!connectionData) {
            this.showError('Invalid code or host not found');
            return;
        }
        
        const data = JSON.parse(connectionData);
        this.shareCode = code;
        
        // Show file info
        this.incomingFileName.textContent = data.fileName;
        this.incomingFileSize.textContent = this.formatFileSize(data.fileSize);
        this.totalSize = data.fileSize;
        
        this.connectionInfo.classList.remove('hidden');
        this.connectionMessage.textContent = 'Connecting to sender...';
        
        // Initialize WebRTC as client
        this.initializeWebRTC(false);
    }

    async initializeWebRTC(isHost) {
        try {
            // Create peer connection
            this.peerConnection = new RTCPeerConnection({
                iceServers: [] // No STUN servers for local network
            });
            
            // Handle ICE candidates
            this.peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    this.storeSignalingData('ice_candidate', event.candidate);
                }
            };
            
            // Handle connection state changes
            this.peerConnection.onconnectionstatechange = () => {
                this.updateConnectionStatus(this.peerConnection.connectionState);
            };
            
            if (isHost) {
                // Create data channel for file transfer
                this.dataChannel = this.peerConnection.createDataChannel('fileTransfer', {
                    ordered: true
                });
                this.setupDataChannel();
                
                // Create offer
                const offer = await this.peerConnection.createOffer();
                await this.peerConnection.setLocalDescription(offer);
                this.storeSignalingData('offer', offer);
                
            } else {
                // Handle incoming data channel
                this.peerConnection.ondatachannel = (event) => {
                    this.dataChannel = event.channel;
                    this.setupDataChannel();
                };
                
                // Wait for offer and create answer
                this.waitForOffer();
            }
            
            // Start listening for signaling data
            this.startSignalingListener();
            
        } catch (error) {
            this.showError('Failed to initialize connection: ' + error.message);
        }
    }

    setupDataChannel() {
        this.dataChannel.onopen = () => {
            this.updateConnectionStatus('connected');
            if (this.isHost) {
                this.showSuccess('Connected! Ready to send file.');
            } else {
                this.connectionInfo.classList.add('hidden');
                this.downloadInfo.classList.remove('hidden');
            }
        };
        
        this.dataChannel.onclose = () => {
            this.updateConnectionStatus('disconnected');
        };
        
        this.dataChannel.onerror = (error) => {
            this.showError('Data channel error: ' + error);
        };
        
        this.dataChannel.onmessage = (event) => {
            this.handleDataChannelMessage(event.data);
        };
    }

    async waitForOffer() {
        const checkForOffer = () => {
            const offerData = localStorage.getItem('p2p_signal_' + this.shareCode + '_offer');
            if (offerData) {
                const offer = JSON.parse(offerData);
                this.handleSignalingData('offer', offer);
                return;
            }
            setTimeout(checkForOffer, 500);
        };
        checkForOffer();
    }

    storeSignalingData(type, data) {
        const key = 'p2p_signal_' + this.shareCode + '_' + type + '_' + (this.isHost ? 'host' : 'client');
        localStorage.setItem(key, JSON.stringify(data));
    }

    startSignalingListener() {
        const checkForSignals = () => {
            const prefix = 'p2p_signal_' + this.shareCode + '_';
            const targetSuffix = this.isHost ? '_client' : '_host';
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(prefix) && key.endsWith(targetSuffix)) {
                    const type = key.replace(prefix, '').replace(targetSuffix, '');
                    const data = JSON.parse(localStorage.getItem(key));
                    this.handleSignalingData(type, data);
                    localStorage.removeItem(key);
                }
            }
        };
        
        this.signalingInterval = setInterval(checkForSignals, 500);
    }

    async handleSignalingData(type, data) {
        try {
            switch (type) {
                case 'offer':
                    await this.peerConnection.setRemoteDescription(data);
                    const answer = await this.peerConnection.createAnswer();
                    await this.peerConnection.setLocalDescription(answer);
                    this.storeSignalingData('answer', answer);
                    break;
                    
                case 'answer':
                    await this.peerConnection.setRemoteDescription(data);
                    break;
                    
                case 'ice_candidate':
                    await this.peerConnection.addIceCandidate(data);
                    break;
            }
        } catch (error) {
            this.showError('Signaling error: ' + error.message);
        }
    }

    handleStorageChange(e) {
        // Handle storage changes for cross-tab communication
        if (e.key && e.key.startsWith('p2p_signal_' + this.shareCode)) {
            // Signaling data updated by other methods
        }
    }

    acceptFile() {
        this.downloadInfo.classList.add('hidden');
        this.downloadProgress.classList.remove('hidden');
        
        // Send acceptance message
        this.dataChannel.send(JSON.stringify({
            type: 'file_accepted'
        }));
        
        this.receivedChunks = [];
        this.receivedSize = 0;
        this.startTime = Date.now();
    }

    rejectFile() {
        this.dataChannel.send(JSON.stringify({
            type: 'file_rejected'
        }));
        this.reset();
    }

    handleDataChannelMessage(data) {
        try {
            // Try to parse as JSON first (control messages)
            const message = JSON.parse(data);
            
            switch (message.type) {
                case 'file_info':
                    this.handleFileInfo(message);
                    break;
                case 'file_accepted':
                    this.startFileTransfer();
                    break;
                case 'file_rejected':
                    this.showError('File transfer was rejected');
                    break;
                case 'transfer_complete':
                    this.handleTransferComplete();
                    break;
            }
        } catch (e) {
            // Binary data (file chunk)
            this.handleFileChunk(data);
        }
    }

    handleFileInfo(info) {
        this.totalChunks = info.totalChunks;
        this.totalSize = info.totalSize;
    }

    startFileTransfer() {
        if (!this.fileData || !this.dataChannel) {
            this.showError('No file or connection available');
            return;
        }
        
        this.transferProgress.classList.remove('hidden');
        this.startTime = Date.now();
        
        // Send file info first
        const totalChunks = Math.ceil(this.fileData.byteLength / this.chunkSize);
        this.dataChannel.send(JSON.stringify({
            type: 'file_info',
            totalChunks: totalChunks,
            totalSize: this.fileData.byteLength,
            fileName: this.currentFile.name
        }));
        
        // Send file chunks
        let offset = 0;
        let chunkIndex = 0;
        
        const sendChunk = () => {
            if (offset >= this.fileData.byteLength) {
                // Transfer complete
                this.dataChannel.send(JSON.stringify({
                    type: 'transfer_complete'
                }));
                this.showSuccess('File sent successfully!');
                return;
            }
            
            const chunk = this.fileData.slice(offset, offset + this.chunkSize);
            this.dataChannel.send(chunk);
            
            offset += this.chunkSize;
            chunkIndex++;
            
            // Update progress
            const progress = Math.min(100, (offset / this.fileData.byteLength) * 100);
            this.updateProgress(progress, offset);
            
            // Continue sending (with small delay to prevent overwhelming)
            setTimeout(sendChunk, 10);
        };
        
        sendChunk();
    }

    handleFileChunk(chunk) {
        this.receivedChunks.push(new Uint8Array(chunk));
        this.receivedSize += chunk.byteLength;
        
        // Update progress
        const progress = Math.min(100, (this.receivedSize / this.totalSize) * 100);
        this.updateDownloadProgress(progress, this.receivedSize);
        
        // Check if transfer is complete
        if (this.receivedSize >= this.totalSize) {
            this.completeFileDownload();
        }
    }

    completeFileDownload() {
        // Combine all chunks
        const totalLength = this.receivedChunks.reduce((acc, chunk) => acc + chunk.length, 0);
        const combinedArray = new Uint8Array(totalLength);
        let offset = 0;
        
        for (const chunk of this.receivedChunks) {
            combinedArray.set(chunk, offset);
            offset += chunk.length;
        }
        
        // Create blob and download
        const blob = new Blob([combinedArray]);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.incomingFileName.textContent || 'downloaded_file';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showSuccess('File downloaded successfully!');
    }

    updateProgress(percentage, bytes) {
        this.progressFill.style.width = percentage + '%';
        this.progressPercentage.textContent = Math.round(percentage) + '%';
        
        if (this.startTime) {
            const elapsed = (Date.now() - this.startTime) / 1000;
            const speed = bytes / elapsed;
            this.transferSpeed.textContent = this.formatSpeed(speed);
        }
    }

    updateDownloadProgress(percentage, bytes) {
        this.downloadProgressFill.style.width = percentage + '%';
        this.downloadPercentage.textContent = Math.round(percentage) + '%';
        
        if (this.startTime) {
            const elapsed = (Date.now() - this.startTime) / 1000;
            const speed = bytes / elapsed;
            this.downloadSpeed.textContent = this.formatSpeed(speed);
        }
    }

    updateConnectionStatus(status) {
        const statusMap = {
            'ready': { text: 'Ready', dotClass: '', peerCount: '0' },
            'connecting': { text: 'Connecting', dotClass: 'connecting', peerCount: '0' },
            'connected': { text: 'Connected', dotClass: 'connected', peerCount: '1' },
            'disconnected': { text: 'Ready', dotClass: '', peerCount: '0' },
            'failed': { text: 'Ready', dotClass: '', peerCount: '0' },
            'closed': { text: 'Ready', dotClass: '', peerCount: '0' }
        };
        
        const statusInfo = statusMap[status] || statusMap.ready;
        this.connectionStatus.textContent = statusInfo.text;
        this.connectionDot.className = `fas fa-circle ${statusInfo.dotClass}`;
        this.peerCount.textContent = statusInfo.peerCount;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    formatSpeed(bytesPerSecond) {
        return this.formatFileSize(bytesPerSecond) + '/s';
    }

    showError(message) {
        this.errorText.textContent = message;
        this.errorNotification.classList.remove('hidden');
        setTimeout(() => this.hideError(), 5000);
    }

    hideError() {
        this.errorNotification.classList.add('hidden');
    }

    showSuccess(message) {
        this.successText.textContent = message;
        this.successNotification.classList.remove('hidden');
        setTimeout(() => this.hideSuccess(), 3000);
    }

    hideSuccess() {
        this.successNotification.classList.add('hidden');
    }

    reset() {
        // Close connections
        if (this.dataChannel) {
            this.dataChannel.close();
            this.dataChannel = null;
        }
        
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }
        
        // Clear signaling interval
        if (this.signalingInterval) {
            clearInterval(this.signalingInterval);
        }
        
        // Clear local storage
        if (this.shareCode) {
            const keys = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.includes(this.shareCode)) {
                    keys.push(key);
                }
            }
            keys.forEach(key => localStorage.removeItem(key));
        }
        
        // Reset UI
        this.fileInfo.classList.add('hidden');
        this.shareInfo.classList.add('hidden');
        this.transferProgress.classList.add('hidden');
        this.connectionInfo.classList.add('hidden');
        this.downloadInfo.classList.add('hidden');
        this.downloadProgress.classList.add('hidden');
        
        // Reset variables
        this.fileData = null;
        this.currentFile = null;
        this.shareCode = null;
        this.receivedChunks = [];
        this.receivedSize = 0;
        this.totalSize = 0;
        this.startTime = null;
        
        // Reset form
        this.fileInput.value = '';
        this.codeInput.value = '';
        
        this.updateConnectionStatus('disconnected');
    }

    // QR Scanner Functions
    async openQRScanner() {
        try {
            await this.initializeCamera();
            this.qrScanner.classList.remove('hidden');
            this.scannerActive = true;
            this.startQRScanning();
        } catch (error) {
            this.showError('Camera access denied or not available');
        }
    }

    closeQRScanner() {
        this.scannerActive = false;
        this.qrScanner.classList.add('hidden');
        this.stopCamera();
    }

    async initializeCamera() {
        // Get available cameras
        const devices = await navigator.mediaDevices.enumerateDevices();
        this.cameras = devices.filter(device => device.kind === 'videoinput');
        
        if (this.cameras.length === 0) {
            throw new Error('No cameras found');
        }

        // Start with back camera if available, otherwise use first camera
        const preferredCamera = this.cameras.find(camera => 
            camera.label.toLowerCase().includes('back') || 
            camera.label.toLowerCase().includes('rear')
        ) || this.cameras[0];
        
        this.currentCameraIndex = this.cameras.indexOf(preferredCamera);
        await this.startCamera();
    }

    async startCamera() {
        this.stopCamera(); // Stop any existing stream
        
        const constraints = {
            video: {
                deviceId: this.cameras[this.currentCameraIndex]?.deviceId,
                facingMode: 'environment', // Prefer back camera
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        };

        try {
            this.currentStream = await navigator.mediaDevices.getUserMedia(constraints);
            this.qrVideo.srcObject = this.currentStream;
            this.scannerStatusText.textContent = 'Looking for QR code...';
        } catch (error) {
            this.showError('Failed to access camera: ' + error.message);
        }
    }

    stopCamera() {
        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => track.stop());
            this.currentStream = null;
        }
    }

    async toggleCamera() {
        if (this.cameras.length > 1) {
            this.currentCameraIndex = (this.currentCameraIndex + 1) % this.cameras.length;
            await this.startCamera();
        }
    }

    startQRScanning() {
        const scanFrame = () => {
            if (!this.scannerActive) return;

            if (this.qrVideo.readyState === this.qrVideo.HAVE_ENOUGH_DATA) {
                this.scanQRCode();
            }

            requestAnimationFrame(scanFrame);
        };
        scanFrame();
    }

    scanQRCode() {
        const canvas = this.qrCanvasScanner;
        const context = canvas.getContext('2d');
        const video = this.qrVideo;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        try {
            // Simple QR code detection - look for share code pattern
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const code = this.detectQRCode(imageData);
            
            if (code && code.length === 6) {
                this.onQRCodeDetected(code);
            }
        } catch (error) {
            // Continue scanning silently
        }
    }

    detectQRCode(imageData) {
        // Basic QR code detection simulation
        // In a real implementation, you'd use jsQR library: https://github.com/cozmo/jsQR
        
        // Check for stored QR codes that match current patterns
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('qr_code_')) {
                try {
                    const qrData = JSON.parse(localStorage.getItem(key));
                    const code = qrData.code;
                    
                    // Check if the corresponding connection data exists
                    const connectionKey = 'p2p_connection_' + code;
                    if (localStorage.getItem(connectionKey) && code.length === 6) {
                        // Simulate QR pattern recognition delay
                        const currentTime = Date.now();
                        if (currentTime - qrData.timestamp < 300000) { // 5 minutes timeout
                            return code;
                        }
                    }
                } catch (error) {
                    // Invalid QR data, continue
                }
            }
        }
        
        return null;
    }

    onQRCodeDetected(code) {
        this.scannerStatusText.textContent = 'QR Code detected!';
        this.scannerStatusText.style.color = '#00ff00';
        
        // Vibrate if supported
        if (navigator.vibrate) {
            navigator.vibrate(100);
        }
        
        setTimeout(() => {
            this.closeQRScanner();
            this.codeInput.value = code;
            this.handleCodeInput({ target: { value: code } });
            this.showSuccess('QR code scanned successfully!');
        }, 500);
    }

    initializeServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/service-worker.js')
                .then((registration) => {
                    console.log('Service Worker registered:', registration);
                })
                .catch((error) => {
                    console.log('Service Worker registration failed:', error);
                });
        }
    }

    generateManifest() {
        const manifest = {
            name: 'P2P File Share',
            short_name: 'P2P Share',
            description: 'Peer-to-peer file sharing using WebRTC',
            start_url: '/',
            display: 'standalone',
            background_color: '#667eea',
            theme_color: '#667eea',
            icons: [
                {
                    src: 'data:image/svg+xml;base64,' + btoa(`
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192" fill="#667eea">
                            <rect x="48" y="48" width="96" height="96" rx="16" fill="currentColor"/>
                            <path d="M96 72l16 16H96V72z" fill="white"/>
                            <rect x="80" y="96" width="32" height="8" fill="white"/>
                            <rect x="80" y="112" width="24" height="8" fill="white"/>
                        </svg>
                    `),
                    sizes: '192x192',
                    type: 'image/svg+xml'
                }
            ]
        };
        
        const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
        const manifestUrl = URL.createObjectURL(manifestBlob);
        
        const link = document.createElement('link');
        link.rel = 'manifest';
        link.href = manifestUrl;
        document.head.appendChild(link);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new P2PFileShare();
});
