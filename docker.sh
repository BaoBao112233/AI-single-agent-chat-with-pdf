#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 AI Chat with PDF - Docker Setup${NC}"
echo "=================================="

# Function to check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
        exit 1
    fi
    
    # Check for both docker-compose and docker compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Docker and Docker Compose are installed${NC}"
}

# Function to build and start services
start_services() {
    echo -e "${YELLOW}📦 Building Docker images...${NC}"
    docker compose build
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Docker images built successfully${NC}"
    else
        echo -e "${RED}❌ Failed to build Docker images${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}🚀 Starting services...${NC}"
    docker compose up -d
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Services started successfully${NC}"
        echo ""
        echo "🌐 Frontend: http://localhost"
        echo "🔧 Backend API: http://localhost:8000"
        echo ""
        echo "📋 To view logs: docker compose logs -f"
        echo "🛑 To stop services: docker compose down"
    else
        echo -e "${RED}❌ Failed to start services${NC}"
        exit 1
    fi
}

# Function to stop services
stop_services() {
    echo -e "${YELLOW}🛑 Stopping services...${NC}"
    docker compose down
    echo -e "${GREEN}✅ Services stopped${NC}"
}

# Function to show logs
show_logs() {
    docker compose logs -f
}

# Function to rebuild services
rebuild_services() {
    echo -e "${YELLOW}🔄 Rebuilding services...${NC}"
    docker compose down
    docker compose build --no-cache
    docker compose up -d
    echo -e "${GREEN}✅ Services rebuilt and started${NC}"
}

# Main menu
case "$1" in
    "start")
        check_docker
        start_services
        ;;
    "stop")
        stop_services
        ;;
    "logs")
        show_logs
        ;;
    "rebuild")
        check_docker
        rebuild_services
        ;;
    "restart")
        stop_services
        check_docker
        start_services
        ;;
    *)
        echo "Usage: $0 {start|stop|logs|rebuild|restart}"
        echo ""
        echo "Commands:"
        echo "  start    - Build and start all services"
        echo "  stop     - Stop all services"
        echo "  logs     - Show logs from all services"
        echo "  rebuild  - Rebuild and restart all services"
        echo "  restart  - Restart all services"
        exit 1
        ;;
esac
