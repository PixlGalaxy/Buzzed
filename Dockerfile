# ---------- FRONTEND BUILD ----------
FROM node:20-bullseye AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# ---------- BACKEND BUILD ----------
FROM node:20-bullseye AS backend
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci
COPY backend/ .
RUN npm run build

# ---------- RUNTIME (NODE BACKEND + NGINX) ----------
FROM nginx:1.27-alpine AS runtime
WORKDIR /app

# Copiar build del frontend a la carpeta pública de Nginx
COPY --from=frontend /app/frontend/dist /usr/share/nginx/html

# Copiar el backend Node compilado
COPY --from=backend /app/backend/dist /app/backend/dist
COPY --from=backend /app/backend/node_modules /app/backend/node_modules
COPY backend/package.json /app/backend/package.json

# Copiar configuración de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Instalar Node en el contenedor Nginx (para que corra backend)
RUN apk add --no-cache nodejs npm

# Exponer los puertos
EXPOSE 80

# Iniciar backend y Nginx
CMD node /app/backend/dist/index.js & nginx -g 'daemon off;'
