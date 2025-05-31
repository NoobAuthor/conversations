#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Language Conversation App Development Environment${NC}"

# Check if tmux is available
if ! command -v tmux &> /dev/null; then
    echo -e "${YELLOW}⚠️  tmux not found. Install with: sudo pacman -S tmux${NC}"
    echo -e "${YELLOW}Starting services in background instead...${NC}"
    
    # Start services in background
    cd backend && npm run dev &
    BACKEND_PID=$!
    
    cd ../frontend && npm run dev &
    FRONTEND_PID=$!
    
    echo -e "${GREEN}✅ Backend running on http://localhost:3001 (PID: $BACKEND_PID)${NC}"
    echo -e "${GREEN}✅ Frontend running on http://localhost:5173 (PID: $FRONTEND_PID)${NC}"
    echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
    
    # Wait for Ctrl+C
    trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
    wait
else
    # Use tmux for better development experience
    tmux new-session -d -s langapp 'cd backend && npm run dev'
    tmux split-window -v 'cd frontend && npm run dev'
    tmux split-window -h 'echo "Development tools ready. Commands:"; echo "- Backend: http://localhost:3001"; echo "- Frontend: http://localhost:5173"; echo "- Prisma Studio: npx prisma studio"; bash'
    tmux select-pane -t 0
    tmux attach-session -t langapp
fi
