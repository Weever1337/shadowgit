FROM node:18
WORKDIR /shadowgit
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE ${PORT:-3000}
CMD ["npm", "start"]