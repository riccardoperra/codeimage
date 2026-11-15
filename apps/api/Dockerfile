# Image Railway builds from dist/api-bundle (see scripts/prepare-api-deploy.mjs).
# The bundle has no lockfile, so npm resolves the pinned versions from package.json.
FROM node:24-slim

WORKDIR /app
ENV NODE_ENV=production

COPY package.json ./
COPY workspace-dependencies ./workspace-dependencies
RUN npm install --omit=dev --no-audit --no-fund

COPY . .

CMD ["npm", "run", "start:railway"]
