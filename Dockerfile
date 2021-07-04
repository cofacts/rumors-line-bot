FROM node:16-alpine AS builder
WORKDIR /srv/www

# make node_modules cached.
# Src: https://nodesource.com/blog/8-protips-to-start-killing-it-when-dockerizing-node-js/
#
COPY package.json package-lock.json ./
RUN npm install

# Other files, so that other files do not interfere with node_modules cache
#
COPY . .

ARG LOCALE=en_US
RUN NODE_ENV=production npm run build
RUN npm prune --production

#########################################

FROM node:16-alpine

WORKDIR /srv/www
EXPOSE 5001
ENTRYPOINT NODE_ENV=production npm start

RUN apk --no-cache add tesseract-ocr tesseract-ocr-data-chi_tra

COPY package.json package-lock.json ecosystem.config.js ./
COPY i18n i18n
COPY static static
COPY --from=builder /srv/www/node_modules ./node_modules
COPY --from=builder /srv/www/build ./build
COPY --from=builder /srv/www/liff ./liff
