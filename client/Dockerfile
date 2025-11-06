# Stage 1: Build the React App
FROM node:20-alpine AS build

RUN apk update && apk upgrade

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Serve the App with Nginx
FROM nginx:1.26.3-alpine

# Update packages to pick up security patches
RUN apk upgrade --no-cache

COPY --from=build /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]