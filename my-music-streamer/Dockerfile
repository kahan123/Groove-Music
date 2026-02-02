# 1. Use a lightweight Node.js image (Linux)
FROM node:18-alpine

# 2. INSTALL PYTHON (Crucial for yt-dlp to work)
# Alpine Linux uses 'apk' to install packages
RUN apk add --no-cache python3 py3-pip

# 3. Setup App Directory
WORKDIR /app

# 4. Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# 5. Copy the rest of your code
COPY . .

# 6. Create the songs directory (empty)
RUN mkdir -p songs

# 7. Expose the port
EXPOSE 3001

# 8. Start the server
CMD ["node", "index.js"]