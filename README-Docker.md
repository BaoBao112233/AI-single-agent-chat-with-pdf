# AI Chat with PDF - Docker Deployment

This project is containerized using Docker and Docker Compose for easy deployment and development.

## 📋 Prerequisites

- Docker (version 20.10 or higher)
- Docker Compose (version 2.0 or higher)

## 🚀 Quick Start

### Option 1: Using the convenience script

```bash
# Make the script executable (if not already)
chmod +x docker.sh

# Start all services
./docker.sh start

# Stop all services
./docker.sh stop

# View logs
./docker.sh logs

# Rebuild and restart
./docker.sh rebuild
```

### Option 2: Using Docker Compose directly

```bash
# Build and start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild services
docker-compose build --no-cache
```

## 🌐 Access the Application

- **Frontend**: http://localhost
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 📁 Project Structure

```
.
├── backend/
│   ├── Dockerfile
│   ├── .dockerignore
│   └── ... (Python FastAPI application)
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── .dockerignore
│   └── ... (React TypeScript application)
├── docker-compose.yml
├── docker.sh
└── README-Docker.md
```

## 🔧 Configuration

### Environment Variables

The backend supports the following environment variables:

- `ENVIRONMENT`: Set to `production` for production deployment
- Add other environment variables as needed in the docker-compose.yml

### Data Persistence

The following volumes are configured for data persistence:

- `backend_data`: Database files
- `backend_memories`: Chat history and memories
- `backend_uploads`: Uploaded PDF files

## 📊 Monitoring

### Health Checks

The backend includes a health check endpoint. You can monitor the service health:

```bash
# Check backend health
curl http://localhost:8000/health
```

### Logs

```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs frontend

# Follow logs in real-time
docker-compose logs -f
```

## 🛠️ Development

### Local Development with Docker

1. Make changes to your code
2. Rebuild the specific service:
   ```bash
   docker-compose build backend  # For backend changes
   docker-compose build frontend # For frontend changes
   ```
3. Restart the service:
   ```bash
   docker-compose up -d
   ```

### Debugging

To access a running container for debugging:

```bash
# Access backend container
docker-compose exec backend bash

# Access frontend container
docker-compose exec frontend sh
```

## 🚨 Troubleshooting

### Common Issues

1. **Port conflicts**: If ports 80 or 8000 are already in use, modify the ports in `docker-compose.yml`

2. **Build failures**: Clean Docker cache and rebuild:
   ```bash
   docker system prune -a
   ./docker.sh rebuild
   ```

3. **Permission issues**: Make sure the docker.sh script is executable:
   ```bash
   chmod +x docker.sh
   ```

### Reset Everything

To completely reset the application (remove all data):

```bash
docker-compose down -v
docker system prune -a
./docker.sh start
```

## 📝 Notes

- The frontend is served by Nginx and configured to proxy API requests to the backend
- All application data is persisted in Docker volumes
- The application supports hot-reloading during development
- CORS is configured to allow frontend-backend communication

## 🔒 Security Considerations

- The Nginx configuration includes basic security headers
- In production, consider using HTTPS and additional security measures
- Environment variables should be properly secured
- Consider using Docker secrets for sensitive data
