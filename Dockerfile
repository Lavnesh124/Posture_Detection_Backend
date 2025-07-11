# Use Node.js + Python base
FROM node:18-bullseye

# Create working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && \
    apt-get install -y python3 python3-pip python3-opencv libgl1 && \
    pip3 install --upgrade pip

# Copy project files
COPY . .

# Install Python dependencies
RUN pip3 install -r requirements.txt

# Install Node dependencies
RUN npm install

# Expose backend port
EXPOSE 5001

# Start the Node.js server
CMD ["node", "server.js"]
