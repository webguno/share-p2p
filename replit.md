# FileSync - P2P File Share

## Overview

FileSync is a modern, mobile-first peer-to-peer file sharing web application that enables direct file transfer between devices without requiring a central server. The application uses WebRTC technology to establish direct connections between browsers, allowing users to share files securely and efficiently with an intuitive mobile app interface.

## User Preferences

- Preferred communication style: Simple, everyday language
- Design preference: Mobile app layout with Font Awesome icons and advanced animations
- UX requirements: Feels like a native mobile application

## System Architecture

### Frontend Architecture
- **Pure Web Technologies**: Built using vanilla HTML, CSS, and JavaScript without any frameworks
- **Progressive Web App (PWA)**: Includes service worker for offline functionality and web app manifest for installation
- **Mobile App Design**: Native mobile app interface with iPhone-style layout (max-width: 428px)
- **Font Awesome Icons**: Complete icon system using Font Awesome 6.5.1 for modern UI elements
- **Advanced Animations**: CSS keyframe animations, transitions, and loading states for enhanced UX
- **WebRTC Implementation**: Uses native WebRTC APIs for peer-to-peer connections and data channels
- **Responsive Design**: Mobile-first approach with CSS Grid and Flexbox, supporting dynamic viewport heights

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
- **Mobile App Layout**: iPhone-style container with status bar, header, main content, and bottom navigation
- **Mode-Based UI**: Card-style interfaces for sending and receiving files with smooth transitions
- **Advanced Animations**: Shimmer effects, pulse loaders, progress animations, and slide-in transitions
- **Touch-Optimized**: Large touch targets, haptic feedback simulation, and gesture-friendly interactions
- **Icon System**: Font Awesome icons for all UI elements with contextual file type indicators
- **Status Indicators**: Real-time connection dots, animated loading states, and progress tracking
- **Notification System**: Toast-style notifications with slide animations and auto-dismiss

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