FROM node:20

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (better-sqlite3 requires build tools, which node:20 has)
RUN npm install

# Copy application source code
COPY . .

# Expose port
EXPOSE 4000

# Start application
CMD ["npm", "start"]
