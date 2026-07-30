.PHONY: help dev build down logs status clean ensure-env

# UID/GID del host para que volumes escritos por contenedores (frontend-build → dist/) tengan ownership correcto
export UID := $(shell id -u)
export GID := $(shell id -g)

# Compose base commands por entorno
COMPOSE_BASE  = compose.yaml
COMPOSE_DEV   = docker compose --env-file .env.development -f $(COMPOSE_BASE) -f compose.dev.yaml
COMPOSE_BUILD = docker compose --env-file .env.production -f $(COMPOSE_BASE) -f compose.prod.yaml

help:
	@echo "SIEEJ frontend - Comandos disponibles:"
	@echo ""
	@echo "DESARROLLO:"
	@echo "  make dev          - Modo desarrollo (Vite hot-reload)"
	@echo "  make logs         - Ver logs de desarrollo"
	@echo "  make down         - Detener servicios de desarrollo"
	@echo ""
	@echo "BUILD (produccion):"
	@echo "  make ensure-env   - Crea .env.development desde .env.example si falta"
	@echo "  make build        - Construir frontend en frontend/dist (consumido por gateway-hub)"
	@echo ""
	@echo "GENERAL:"
	@echo "  make status       - Ver estado de los servicios"
	@echo "  make clean        - Detener servicios y limpiar todo"
	@echo ""
	@echo "Nota: el backend de SIEEJ vive en mariachi/api (modulo formularios)."
	@echo "      En produccion el dist/ es servido por gateway-hub en /sieej/."

ensure-env:
	@if [ ! -f .env.development ]; then \
		echo ".env.development no existe; copiando desde .env.example..."; \
		cp .env.example .env.development; \
		echo "Edita .env.development para tu entorno local antes de continuar."; \
	fi

dev: ensure-env
	@echo ""
	@echo "Levantando frontend de desarrollo..."
	@$(COMPOSE_DEV) up -d --build
	@echo ""
	@echo "Frontend (Vite):  http://localhost:5174"
	@echo "Backend (mariachi): http://localhost:8000/api/administrador"
	@echo ""
	@echo "Hot-reload activado en frontend"

build:
	@echo ""
	@echo "Construyendo frontend para produccion..."
	@$(COMPOSE_BUILD) run --rm --build frontend-build
	@echo ""
	@echo "Build listo en ./frontend/dist/"
	@echo "Para servir: gateway-hub monta este dist en /sieej/"

down:
	@$(COMPOSE_DEV) down 2>/dev/null || true
	@echo "Servicios de desarrollo detenidos"

clean: down
	@$(COMPOSE_DEV) down -v --remove-orphans 2>/dev/null || true
	@$(COMPOSE_BUILD) down -v --remove-orphans 2>/dev/null || true
	@docker run --rm -v $(CURDIR)/frontend/dist:/dist alpine sh -c "rm -rf /dist/*" 2>/dev/null || true
	@rm -rf frontend/dist frontend/node_modules
	@echo "Limpieza completada"

logs:
	@$(COMPOSE_DEV) logs -f

status:
	@$(COMPOSE_DEV) ps 2>/dev/null || echo "  No hay servicios corriendo"
