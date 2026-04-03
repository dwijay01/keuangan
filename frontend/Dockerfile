# Tahap 1: Build Image berbasis Node.js
FROM node:20-alpine as build
WORKDIR /app

# Install dependency (memanfaatkan layer caching)
COPY package*.json ./
RUN npm ci

# Copy source code dan build React ke folder /dist
COPY . .
ENV VITE_API_URL=/api
RUN npm run build

# Tahap 2: Setup Nginx Web Server untuk menyajikan hasil Build
FROM nginx:alpine

# Reset default conf
RUN rm /etc/nginx/conf.d/default.conf

# Pasang Nginx config kita yang cerdas (SPA + API Proxy)
COPY nginx.conf /etc/nginx/conf.d/

# Salin output React hasil tahapan 'build' di atas ke direktori publik Nginx
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

# Jalankan Nginx sebagai process utama
CMD ["nginx", "-g", "daemon off;"]
