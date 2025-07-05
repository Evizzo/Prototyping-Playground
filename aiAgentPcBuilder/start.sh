#!/bin/bash

echo "🚀 Starting AI PC Builder..."
echo "📁 Navigating to project directory..."

cd "$(dirname "$0")"

echo "📦 Installing dependencies..."
npm install

echo "🌐 Starting development server..."
echo "💡 Open http://localhost:5173 in your browser"
echo "🛑 Press Ctrl+C to stop the server"

npm run dev 