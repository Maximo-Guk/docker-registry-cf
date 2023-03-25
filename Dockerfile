FROM node:18
RUN npm install -g wrangler
WORKDIR /usr/src/app
COPY package*.json wrangler.toml tsconfig.json .dev.vars ./
RUN npm install
COPY src/ src/

EXPOSE 8137
CMD [ "wrangler", "dev"]