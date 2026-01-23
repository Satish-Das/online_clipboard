# 📋 Online Clipboard - Complete Documentation

A modern, real-time clipboard sharing application built with the MERN stack. Share text instantly across all your devices with secure, session-based collaboration.

## 🌟 Overview

Online Clipboard is a full-stack web application that enables users to share text content in real-time across multiple devices. It uses session-based sharing with 6-digit codes, automatic expiration for security, and provides a seamless collaborative experience.

## ✨ Key Features

### 🔄 Real-Time Synchronization
- **Instant Updates**: Content syncs across all connected devices in real-time
- **Socket.IO Integration**: WebSocket-based communication for low-latency updates
- **Typing Indicators**: See when others are typing in shared sessions
- **Auto-Save**: Content automatically saves every 2 seconds

### 🔒 Security & Privacy
- **Session Expiry**: All sessions automatically expire after 30 minutes
- **No Registration**: No user accounts or personal data required
- **Secure Codes**: 6-digit alphanumeric session codes (36^6 = 2.1 billion combinations)
- **Auto-Cleanup**: Expired sessions are automatically removed from the database
- **Rate Limiting**: API protection against abuse and spam

### 📱 Cross-Platform Compatibility
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **PWA Ready**: Can be installed as a Progressive Web App
- **Touch Optimized**: Mobile-first design with touch-friendly controls
- **Offline Capable**: Basic functionality works offline with localStorage

### 🎯 User Experience
- **Recent Sessions**: Local history of recently used sessions
- **Session Timer**: Real-time countdown showing time remaining
- **Session Extension**: Extend sessions by 30 minutes when needed
- **Draft Support**: Automatic draft saving for unsaved content
- **File Upload**: Support for text files (.txt, .md, .json, .csv)
- **Download**: Export clipboard content as text files

## 🏗️ Architecture Overview

### Technology Stack

#### Backend (Node.js/Express)
- **Runtime**: Node.js 16+
- **Framework**: Express.js 4.18+
- **Database**: MongoDB with Mongoose ODM
- **Real-time**: Socket.IO 4.7+
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: Joi schema validation
- **Environment**: dotenv for configuration

#### Frontend (React/Vite)
- **Framework**: React 18+ with Hooks
- **Build Tool**: Vite 5+ for fast development
- **Styling**: Tailwind CSS 3+ for responsive design
- **Icons**: Lucide React for consistent iconography
- **HTTP Client**: Axios with interceptors
- **Real-time**: Socket.IO Client
- **Notifications**: React Hot Toast
- **State Management**: React Hooks (useState, useEffect, custom hooks)

#### Database Schema
```javascript
// MongoDB Collection: clipboards
{
  sessionId: String (6-char, unique, indexed),
  content: String (max 50KB),
  activeUsers: Number (default 0),
  createdAt: Date,
  lastActivity: Date,
  expiresAt: Date (30 min from creation),
  metadata: {
    totalEdits: Number,
    lastEditedBy: String (IP address),
    contentHistory: Array (optional)
  }
}
```


### 📋 Directory Descriptions

#### **Root Level**
- **Configuration Management**: Unified package management and environment setup
- **Documentation Hub**: Centralized documentation and project information
- **Automation Scripts**: Development and deployment automation tools

#### **Backend Architecture**
- **Layered Structure**: Clear separation of concerns (Controllers → Services → Models)
- **Modular Design**: Each feature has its own module with clear boundaries
- **Middleware Pipeline**: Comprehensive request processing and error handling
- **Real-time Layer**: Socket.IO integration for live collaboration features

#### **Frontend Architecture**
- **Component-Based**: Reusable, composable React components
- **Hook-Driven**: Custom hooks for state management and side effects
- **Service Layer**: Abstracted external service integrations
- **Context Providers**: Global state management without prop drilling

#### **Development Infrastructure**
- **Testing Strategy**: Unit, integration, and E2E testing at all levels
- **CI/CD Pipeline**: Automated testing, building, and deployment
- **Code Quality**: ESLint, Prettier, and automated code review
- **Documentation**: Comprehensive guides for all aspects of the project

#### **Deployment & Operations**
- **Containerization**: Docker support for consistent environments
- **Environment Management**: Separate configurations for dev/staging/production
- **Monitoring**: Health checks, logging, and performance monitoring
- **Security**: Comprehensive security measures and vulnerability scanning

This structure follows enterprise-level best practices for:
- **Scalability**: Easy to add new features and scale the application
- **Maintainability**: Clear organization makes code easy to understand and modify
- **Collaboration**: Multiple developers can work efficiently without conflicts
- **Quality Assurance**: Built-in testing and code quality measures
- **DevOps**: Streamlined deployment and operations workflows

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** 16+ ([Download](https://nodejs.org/))
- **npm** or **yarn** package manager
- **MongoDB Atlas** account or local MongoDB instance

### One-Command Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd online-clipboard

# Run automated setup
./setup.sh

# Start both frontend and backend
npm run dev
```

### Manual Setup

```bash
# Install all dependencies
npm run install:all

# Start development servers
npm run dev
```

### Environment Configuration

Create `backend/.env`:
```env
PORT=3001
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/online_clipboard
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

## 📡 API Documentation

### Base URL
```
http://localhost:3001/api
```

### Endpoints

#### 📝 Session Management

**Create Session**
```http
POST /clipboard/create
```
Response:
```json
{
  "success": true,
  "data": {
    "sessionId": "ABC123",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "expiresAt": "2024-01-01T00:30:00.000Z",
    "timeRemaining": 1800
  }
}
```

**Get Session Content**
```http
GET /clipboard/:sessionId
```
Response:
```json
{
  "success": true,
  "data": {
    "sessionId": "ABC123",
    "content": "Hello World!",
    "activeUsers": 2,
    "lastActivity": "2024-01-01T00:15:00.000Z",
    "expiresAt": "2024-01-01T00:30:00.000Z",
    "timeRemaining": 900
  }
}
```

**Update Content**
```http
PUT /clipboard/:sessionId
Content-Type: application/json

{
  "content": "Updated content here"
}
```

#### ⏰ Session Time Management

**Get Time Remaining**
```http
GET /clipboard/:sessionId/time
```

**Extend Session**
```http
POST /clipboard/:sessionId/extend
```

#### 📊 Statistics

**Get Session Stats**
```http
GET /clipboard/:sessionId/stats
```
Response:
```json
{
  "success": true,
  "data": {
    "stats": {
      "activeUsers": 2,
      "contentLength": 1234,
      "wordCount": 200,
      "lineCount": 15,
      "totalEdits": 5,
      "timeRemaining": 900
    }
  }
}
```

#### 🧹 Maintenance

**Cleanup Expired Sessions**
```http
POST /clipboard/cleanup
```

**Delete Session**
```http
DELETE /clipboard/:sessionId
```

### Error Responses

```json
{
  "success": false,
  "message": "Session not found or expired",
  "expired": true
}
```

## 🔌 Real-Time Events (Socket.IO)

### Client to Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `join-session` | `sessionId` | Join a clipboard session |
| `content-update` | `{sessionId, content}` | Update clipboard content |
| `typing-start` | `sessionId` | Start typing indicator |
| `typing-stop` | `sessionId` | Stop typing indicator |
| `leave-session` | - | Leave current session |

### Server to Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `session-joined` | `{sessionId, activeUsers}` | Successfully joined session |
| `content-updated` | `{content, timestamp}` | Content updated by another user |
| `user-joined` | `{activeUsers}` | Another user joined session |
| `user-left` | `{activeUsers}` | User left session |
| `user-typing` | `{isTyping}` | Typing indicator update |
| `error` | `{message}` | Error occurred |

## 💾 Data Storage

### MongoDB Collections

#### `clipboards` Collection
```javascript
{
  _id: ObjectId,
  sessionId: "ABC123",           // 6-character unique identifier
  content: "Hello World!",       // Clipboard content (max 50KB)
  activeUsers: 2,                // Number of connected users
  createdAt: ISODate,            // Session creation time
  lastActivity: ISODate,         // Last content update time
  expiresAt: ISODate,            // Expiration time (30 min from creation)
  metadata: {
    totalEdits: 5,               // Total number of edits
    lastEditedBy: "192.168.1.1", // IP of last editor
    contentHistory: []           // Optional: edit history
  }
}
```

### Browser localStorage

#### Recent Sessions
```javascript
// Key: clipboard_recent_sessions
[
  {
    sessionId: "ABC123",
    action: "created", // or "joined"
    title: "Session ABC123",
    timestamp: "2024-01-01T00:00:00.000Z",
    lastAccessed: "2024-01-01T00:15:00.000Z",
    accessCount: 3
  }
]
```

#### Draft Content
```javascript
// Key: clipboard_draft_content
{
  "ABC123": {
    content: "Draft content...",
    timestamp: "2024-01-01T00:10:00.000Z"
  }
}
```

#### User Preferences
```javascript
// Key: clipboard_user_preferences
{
  showStats: false,
  autoSave: true,
  theme: "light",
  notifications: true
}
```

## 🎨 UI Components

### Core Components

#### `SessionManager.jsx`
- **Purpose**: Main landing page for creating/joining sessions
- **Features**: 
  - Create new session with generated 6-digit code
  - Join existing session with code input
  - Recent sessions history with quick access
  - Responsive design (mobile/desktop layouts)
  - Session statistics display

#### `ClipboardArea.jsx`
- **Purpose**: Main content editing interface
- **Features**:
  - Real-time text editor with auto-save
  - Toolbar with copy, paste, clear, download, upload actions
  - Session timer with extend functionality
  - Statistics panel (word count, character count, lines)
  - Typing indicators and user presence
  - File upload support for text files

#### `RecentSessions.jsx`
- **Purpose**: Manage and display session history
- **Features**:
  - List of recently accessed sessions
  - Editable session titles
  - Quick rejoin functionality
  - Session removal and cleanup
  - Access count and timestamps

#### `SessionTimer.jsx`
- **Purpose**: Real-time session countdown
- **Features**:
  - Live countdown display (HH:MM:SS or MM:SS)
  - Color-coded warnings (green → yellow → orange → red)
  - Session extension button
  - Expiration notifications

### Utility Components

#### `Header.jsx`
- Session information display
- Connection status indicator
- Active user count
- Session code with copy functionality
- Leave session action

#### `Footer.jsx`
- Feature highlights
- Social media links (LinkedIn, GitHub)
- Copyright information

#### `LoadingSpinner.jsx`
- Configurable loading states
- Multiple sizes (sm, md, lg, xl)
- Custom loading messages

#### `ErrorBoundary.jsx`
- React error boundary wrapper
- Graceful error handling
- Error reporting and recovery

## 🔧 Configuration

### Environment Variables

#### Backend (`backend/.env`)
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/online_clipboard

# CORS
CLIENT_URL=http://localhost:5173
```

#### Frontend (Vite Environment)
```env
# API Configuration
VITE_API_URL=http://localhost:3001/api
VITE_SOCKET_URL=http://localhost:3001
```

### Application Constants

#### Session Configuration
- **Session ID Length**: 6 characters (A-Z, 0-9)
- **Session Expiry**: 30 minutes
- **Max Content Length**: 50,000 characters
- **Auto-save Interval**: 2 seconds
- **Max Recent Sessions**: 10

#### Rate Limiting
- **Window**: 15 minutes
- **Max Requests**: 100 per IP
- **Cleanup Interval**: 10 minutes

## 🛠️ Development

### Available Scripts

#### Root Level
```bash
# Development (both servers)
npm run dev

# Production (both servers)
npm start

# Install all dependencies
npm run install:all

# Build frontend
npm run build

# Run tests
npm test

# Lint code
npm run lint
npm run lint:fix
```

#### Backend Only
```bash
npm run backend:dev      # Development with nodemon
npm run backend:start    # Production
npm run backend:test     # Run tests
npm run backend:lint     # ESLint
```

#### Frontend Only
```bash
npm run frontend:dev     # Vite dev server
npm run frontend:start   # Preview build
npm run frontend:test    # Vitest
npm run frontend:lint    # ESLint
```

### Development Workflow

1. **Setup**: Run `./setup.sh` or `npm run install:all`
2. **Development**: Use `npm run dev` to start both servers
3. **Testing**: Access frontend at `http://localhost:5173`
4. **API Testing**: Backend available at `http://localhost:3001`
5. **Database**: Monitor MongoDB Atlas dashboard

### Code Quality

#### ESLint Configuration
- **Backend**: CommonJS with Node.js rules
- **Frontend**: ES modules with React hooks rules
- **Shared**: Consistent formatting and best practices

#### File Structure Conventions
- **Components**: PascalCase (e.g., `SessionManager.jsx`)
- **Services**: camelCase with `.service.js` suffix
- **Utilities**: camelCase with descriptive names
- **Constants**: UPPER_SNAKE_CASE for values

## 🚀 Deployment

### Frontend Deployment (Vercel/Netlify)

1. **Build the frontend**:
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy the `dist` folder** to your hosting platform

3. **Environment Variables**:
   ```env
   VITE_API_URL=https://your-backend-domain.com/api
   VITE_SOCKET_URL=https://your-backend-domain.com
   ```

### Backend Deployment (Railway/Heroku/DigitalOcean)

1. **Set environment variables**:
   ```env
   PORT=3001
   MONGODB_URI=mongodb+srv://...
   CLIENT_URL=https://your-frontend-domain.com
   NODE_ENV=production
   ```

2. **Deploy the backend folder**

3. **Ensure MongoDB Atlas** allows connections from your hosting platform

### Docker Deployment

#### Backend Dockerfile
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

#### Frontend Dockerfile
```dockerfile
FROM node:16-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🔒 Security Considerations

### Backend Security
- **Helmet.js**: Security headers
- **CORS**: Configured for specific origins
- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Joi schema validation
- **XSS Prevention**: Content sanitization
- **Session Expiry**: Automatic cleanup

### Frontend Security
- **Content Security Policy**: Prevents XSS
- **HTTPS Only**: Secure connections in production
- **No Sensitive Data**: No user credentials stored
- **Local Storage**: Only non-sensitive session data

### Data Privacy
- **No Registration**: No personal data collection
- **Temporary Sessions**: Auto-expire after 30 minutes
- **IP Logging**: Only for rate limiting (not stored permanently)
- **No Content Persistence**: Sessions are temporary

## 📊 Performance Optimization

### Backend Optimizations
- **Database Indexing**: Session ID indexed for fast lookups
- **Connection Pooling**: MongoDB connection optimization
- **Compression**: Gzip compression for responses
- **Caching**: In-memory session caching
- **Cleanup Jobs**: Automatic expired session removal

### Frontend Optimizations
- **Code Splitting**: Vite automatic code splitting
- **Tree Shaking**: Unused code elimination
- **Asset Optimization**: Image and font optimization
- **Lazy Loading**: Components loaded on demand
- **Service Workers**: PWA caching strategies

### Real-time Optimizations
- **WebSocket Fallback**: Polling fallback for WebSocket failures
- **Reconnection Logic**: Automatic reconnection with exponential backoff
- **Event Debouncing**: Prevents excessive API calls
- **Typing Indicators**: Optimized for minimal bandwidth

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test
```

Test coverage includes:
- **Unit Tests**: Individual function testing
- **Integration Tests**: API endpoint testing
- **Socket Tests**: Real-time event testing
- **Database Tests**: MongoDB operations

### Frontend Testing
```bash
cd frontend
npm test
```

Test coverage includes:
- **Component Tests**: React component rendering
- **Hook Tests**: Custom hook functionality
- **Service Tests**: API and socket services
- **Integration Tests**: User workflow testing

### Manual Testing Checklist

#### Session Management
- [ ] Create new session generates unique 6-digit code
- [ ] Join session with valid code works
- [ ] Join session with invalid code shows error
- [ ] Session expires after 30 minutes
- [ ] Session extension works correctly

#### Real-time Features
- [ ] Content syncs across multiple browsers
- [ ] Typing indicators work correctly
- [ ] User count updates when users join/leave
- [ ] Connection status shows correctly

#### UI/UX
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] Recent sessions save and load correctly
- [ ] File upload and download work
- [ ] Copy/paste functionality works
- [ ] Error messages are user-friendly

## 🐛 Troubleshooting

### Common Issues

#### Connection Problems
**Issue**: Cannot connect to backend
**Solutions**:
- Check if backend is running on port 3001
- Verify CORS configuration in backend
- Check firewall settings
- Ensure MongoDB connection is working

#### Session Issues
**Issue**: Session not found or expired
**Solutions**:
- Check if session ID is exactly 6 characters
- Verify session hasn't expired (30-minute limit)
- Check MongoDB connection and data
- Clear browser localStorage and try again

#### Real-time Sync Issues
**Issue**: Content not syncing between devices
**Solutions**:
- Check WebSocket connection in browser dev tools
- Verify Socket.IO server is running
- Check for network connectivity issues
- Try refreshing both browser windows

#### Performance Issues
**Issue**: Slow loading or updates
**Solutions**:
- Check MongoDB Atlas connection speed
- Verify server resources (CPU, memory)
- Check for large content (50KB limit)
- Monitor network latency

### Debug Mode

Enable debug logging:

#### Backend
```env
NODE_ENV=development
DEBUG=socket.io:*
```

#### Frontend
```javascript
// In browser console
localStorage.debug = 'socket.io-client:*';
```

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit changes: `git commit -m 'Add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Style Guidelines
- Use ESLint configuration provided
- Follow existing naming conventions
- Add comments for complex logic
- Write tests for new features
- Update documentation as needed

### Reporting Issues
When reporting bugs, please include:
- Browser and version
- Steps to reproduce
- Expected vs actual behavior
- Console errors (if any)
- Network tab information

## 📈 Future Enhancements

### Planned Features
- [ ] **User Authentication**: Optional user accounts
- [ ] **Session Passwords**: Password-protected sessions
- [ ] **File Sharing**: Support for images and documents
- [ ] **Collaboration Cursors**: See where others are editing
- [ ] **Voice Notes**: Audio message support
- [ ] **Session Templates**: Predefined content templates
- [ ] **Export Formats**: PDF, Word document export
- [ ] **Mobile Apps**: Native iOS and Android apps

### Technical Improvements
- [ ] **Redis Caching**: Improved performance with Redis
- [ ] **Microservices**: Split into smaller services
- [ ] **GraphQL API**: More efficient data fetching
- [ ] **TypeScript**: Full TypeScript migration
- [ ] **Docker Compose**: Simplified deployment
- [ ] **Kubernetes**: Container orchestration
- [ ] **CDN Integration**: Global content delivery
- [ ] **Analytics**: Usage analytics and monitoring

## 📞 Support & Contact

### Developer Information
**Satish Das**
- **LinkedIn**: [satishdas08](https://www.linkedin.com/in/satishdas08/)
- **GitHub**: [Satish-Das](https://github.com/Satish-Das?tab=repositories)
- **Email**: Contact through LinkedIn or GitHub

### Project Links
- **Repository**: [GitHub Repository URL]
- **Live Demo**: [Demo URL if available]
- **Documentation**: This README file
- **Issues**: [GitHub Issues URL]

### Getting Help
1. **Check Documentation**: Review this README thoroughly
2. **Search Issues**: Look for existing GitHub issues
3. **Create Issue**: Report bugs or request features
4. **Community**: Join discussions in GitHub Discussions

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

This project is open source and available under the MIT License. You are free to use, modify, and distribute this software for any purpose, commercial or non-commercial.

---

**Made with ❤️ by Satish Das © 2024 Online Clipboard**

*Share text instantly across all your devices - Simple, Secure, and Fast!*
