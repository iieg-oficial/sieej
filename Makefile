export UID := $(shell id -u)
export GID := $(shell id -g)

REPO_NAME    := sieej
COMPOSE_PROD := -f compose.yaml -f compose.prod.yaml
COMPOSE_DEV  := -f compose.yaml -f compose.dev.yaml
ENV_PROD     := .env.production
ENV_DEV      := .env.development

UP_PRE       := setup
UP_PROD_CMD   = dc prod run --rm --build frontend-build
DEPLOY_CMD    = dc prod run --rm --build frontend-build
DEPLOY_POST   = dist_listo
CLEAN_EXTRA   = clean_artifacts

include make/common.mk
include make/sieej.mk
