FROM node:carbon
WORKDIR /srv/www

# make node_modules cached.
# Src: https://nodesource.com/blog/8-protips-to-start-killing-it-when-dockerizing-node-js/
#
COPY package.json package-lock.json ./

# When running with --production --pure-lockfile,
# There will always be some missing modules. Dunno why...
#
RUN npm install --production

# Other files, so that other files do not interfere with node_modules cache
#
COPY . .

EXPOSE 5001

ENTRYPOINT NODE_ENV=production node build/index
