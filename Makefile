include .env

help:	## List all make commands
	@awk 'BEGIN {FS = ":.*##"; printf "\n  Please use `make <target>` where <target> is one of:\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) }' $(MAKEFILE_LIST)
	@echo ' '

build:		## Build the project with -d and --no-recreate flags
	docker compose up --build --no-recreate -d

install:	## Exec container and make npm install commands
	docker compose exec mct_web npm install

bundle:
	docker compose exec mct_web npm run bundle

clean:		## Remove all dist/ files
	docker compose exec mct_web rm -r dist/*

bash:	## Interact to install new packages or run specific commands in container
	docker compose exec -it mct_web bash

dev:		# Internal command to run dev npm command script
	docker compose exec -it mct_web npm run development

up:		## Run up -d Docker command container will wait for interactions
	docker compose up -d

start:	up dev ## Up the docker env and run the npm run dev it to

first:	build install dev ## Build the env, up it and run the npm install and then run npm run dev it to

stop:	./compose.yml	## Stop and remove containers
	docker compose kill
	docker compose rm --force
restart:  stop start dev ## Stop and restart container

types:   ## Run type check and generator
	docker compose exec mct_web npm run types

types-watch:   ## Run type check and generator
	docker compose exec mct_web npm run types-watch

clear:	stop ./compose.yml ## Stop and remove container and orphans
	docker compose down -v --remove-orphans

.PHONY: bash build clean help logs start stop types types-watch
