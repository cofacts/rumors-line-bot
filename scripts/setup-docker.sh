#!/bin/bash

docker-compose down
docker-compose up -d

GREEN='\033[0;32m'
UNSET='\033[0m'

printf "Waiting for Redis   ... "
until [ "$(docker exec -it redis redis-cli INFO SERVER | grep uptime_in_seconds | head -1)" ]; do
  sleep 1
done
echo -e "${GREEN}ready${UNSET}"

printf "Waiting for MongoDB ... "
until [ "$(docker exec -it mongodb mongo mongodb://root:root-test-password@localhost --quiet --eval "db.stats()" | grep ok | head -1)" ]; do
  sleep 1
done
echo -e "${GREEN}ready${UNSET}"
