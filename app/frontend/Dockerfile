FROM node:22-alpine AS build
WORKDIR /srv/frontend
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Adresse interne du serveur Django, figée à la construction (rewrites Next)
ARG BACKEND_URL=http://backend:8000
ENV BACKEND_URL=$BACKEND_URL
RUN npm run build

FROM node:22-alpine
WORKDIR /srv/frontend
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build /srv/frontend/.next/standalone ./
COPY --from=build /srv/frontend/.next/static ./.next/static
COPY --from=build /srv/frontend/public ./public
RUN addgroup -S app && adduser -S app -G app && chown -R app:app /srv/frontend
USER app
EXPOSE 3000
CMD ["node", "server.js"]
