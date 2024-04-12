# Use official Node.js image as the base image
FROM node:latest
RUN git clone https://github.com/Primi373-creator/qr-pair/ /app
# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 8000

# Command to run the application
CMD ["npm", "start"]
