FROM node:10

# Create app directory
WORKDIR C:/Users/R.Mohan Raj/Documents/GitHub/Admin_Login_Backend/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

EXPOSE 3000
CMD [ "nodemon", "app.js" ]