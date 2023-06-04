FROM node:20
RUN apt-get update && apt-get install -y libc++1
RUN npm install -g wrangler
WORKDIR /usr/src/app
COPY package*.json wrangler.toml tsconfig.json ./
RUN npm ci
COPY src/ src/

EXPOSE 8137
CMD [ "wrangler", "dev", "--remote"]