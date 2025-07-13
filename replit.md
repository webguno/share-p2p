# P2P File Share

## Overview

This is a peer-to-peer file sharing web application that enables direct file transfer between devices without requiring a central server. The application uses WebRTC technology to establish direct connections between browsers, allowing users to share files securely and efficiently.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Pure Web Technologies**: Built using vanilla HTML, CSS, and JavaScript without any frameworks
- **Progressive Web App (PWA)**: Includes service worker for offline functionality and web app manifest for installation
- **WebRTC Implementation**: Uses native WebRTC APIs for peer-to-peer connections and data channels
- **Responsive Design**: Mobile-first approach with CSS Grid and Flexbox for layout

### Backend Architecture
- **Serverless**: No traditional backend server required
- **Peer-to-Peer**: Direct browser-to-browser communication using WebRTC
- **Signaling**: Relies on share codes for connection establishment (manual signaling)

## Key Components

### 1. Main Application (`main.js`)
- **P2PFileShare Class**: Core application logic handling WebRTC connections
- **File Handling**: Drag-and-drop file selection, chunked file transfer
- **Connection Management**: Peer connection setup, data channel management
- **UI State Management**: Mode switching, progress tracking, status updates

### 2. Service Worker (`service-worker.js`)
- **Caching Strategy**: Cache-first approach for offline functionality
- **Resource Management**: Caches HTML, CSS, and JavaScript files
- **Offline Support**: Serves cached content when network is unavailable

### 3. User Interface (`index.html`, `styles.css`)
- **Mode-Based UI**: Separate interfaces for sending and receiving files
- **Real-time Feedback**: Connection status, transfer progress, peer count
- **Mobile-Optimized**: Responsive design with touch-friendly interactions

## Data Flow

### File Sending Process
1. User selects send mode and chooses a file
2. Application generates a unique share code
3. File is chunked into 16KB pieces for transfer
4. QR code is generated for easy sharing
5. Receiver enters share code to establish connection
6. WebRTC data channel transfers file chunks
7. Progress is tracked and displayed in real-time

### File Receiving Process
1. User selects receive mode and enters share code
2. WebRTC connection is established with sender
3. File metadata is received first (name, size, type)
4. File chunks are received and reassembled
5. Complete file is downloaded to user's device

### Connection Management
- **WebRTC Peer Connection**: Direct browser-to-browser communication
- **Data Channels**: Reliable, ordered file transfer
- **Manual Signaling**: Share codes replace traditional signaling servers

## External Dependencies

### Browser APIs
- **WebRTC API**: For peer-to-peer connections and data channels
- **File API**: For file reading and blob manipulation
- **Canvas API**: For QR code generation (if implemented)
- **Service Worker API**: For offline functionality

### No External Libraries
- Pure vanilla JavaScript implementation
- No CDN dependencies or external packages
- Self-contained application architecture

## Deployment Strategy

### Static Hosting
- **Client-Side Only**: Can be deployed on any static hosting service
- **No Server Requirements**: Works with GitHub Pages, Netlify, Vercel, etc.
- **PWA Installation**: Users can install as native app on mobile devices

### Browser Compatibility
- **Modern Browsers**: Requires WebRTC support (Chrome, Firefox, Safari, Edge)
- **HTTPS Required**: WebRTC requires secure context for production use
- **Mobile Support**: Responsive design works on smartphones and tablets

### Performance Considerations
- **Chunk-Based Transfer**: 16KB chunks prevent memory issues with large files
- **Progress Tracking**: Real-time feedback for user experience
- **Offline Caching**: Service worker enables offline access to the application

## Security Features

### Data Privacy
- **Direct Transfer**: Files never pass through external servers
- **Local Processing**: All file operations happen in browser
- **Temporary Codes**: Share codes are session-based and temporary

### Connection Security
- **WebRTC Encryption**: Built-in DTLS encryption for data channels
- **HTTPS Requirement**: Secure context required for WebRTC functionality
- **No Data Persistence**: Files and codes are not stored permanently