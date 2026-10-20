FROM oven/bun:1 AS build

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

ARG VITE_BASEBOX_PUBLIC_KEY=""
ENV VITE_BASEBOX_PUBLIC_KEY=${VITE_BASEBOX_PUBLIC_KEY}
RUN bun run build

FROM nginx:1.27-alpine

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/client /usr/share/nginx/html

EXPOSE 8080
