# Use Node 18 (Slim version for smaller size)
FROM node:18-slim

# Install system dependencies
# Python3 is needed for yt-dlp (if using the script version)
# ffmpeg is recommended for audio processing/merging
# calabash/ca-certificates for HTTPS
RUN apt-get update && apt-get install -y \
    python3 \
    ffmpeg \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files first (better caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app code
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
