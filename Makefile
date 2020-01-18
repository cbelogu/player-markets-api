all:

# DOCKER Variables
DOCKER_NAME := cbelogu
DOCKER_REPO := gaphunters

build:
	docker build --tag='logging' --file='$(DOCKER_NAME)/$(DOCKER_REPO)' .

publish:
	docker push '$(DOCKER_NAME)/$(DOCKER_REPO)'