FROM node:18

WORKDIR /usr/../app

COPY package*.json ./

COPY . .
RUN npm install
RUN npm run build

ENV PORT=4000
ENV TZ=Asia/Kolkata
EXPOSE 4000

CMD [ "npm", "start" ]