.PHONY: help dev build down logs status clean

# UID/GID del host para que volumes escritos por contenedores (frontend-build → dist/) tengan ownership correcto
export UID := $(shell id -u)
export GID := $(shell id -g)

# Compose base commands por entorno
COMPOSE_DEV   = docker compose -p sieej-dev --env-file .env.development
COMPOSE_BUILD = docker compose -p sieej-build -f docker-compose.yml --env-file .env.production

help:
	@echo "SIEEJ frontend - Comandos disponibles:"
	@echo ""
	@echo "DESARROLLO:"
	@echo "  make dev          - Modo desarrollo (Vite hot-reload)"
	@echo "  make logs         - Ver logs de desarrollo"
	@echo "  make down         - Detener servicios de desarrollo"
	@echo ""
	@echo "BUILD (produccion):"
	@echo "  make build        - Construir frontend en frontend/dist (consumido por mariachi-nginx)"
	@echo ""
	@echo "GENERAL:"
	@echo "  make status       - Ver estado de los servicios"
	@echo "  make clean        - Detener servicios y limpiar todo"
	@echo ""
	@echo "Nota: el backend de SIEEJ vive en mariachi/api (modulo formularios)."
	@echo "      En staging/produccion el dist/ es servido por mariachi-nginx en /sieej/."

dev:
	@echo ""
	@echo "Levantando frontend de desarrollo..."
	@$(COMPOSE_DEV) --profile dev up -d --build
	@echo ""
	@echo "Frontend (Vite):  http://localhost:5174"
	@echo "Backend (mariachi): http://localhost:8000/api/administrador"
	@echo ""
	@echo "Hot-reload activado en frontend"

build:
	@echo ""
	@echo "Construyendo frontend para produccion..."
	@$(COMPOSE_BUILD) --profile build run --rm --build frontend-build
	@echo ""
	@echo "Build listo en ./frontend/dist/"
	@echo "Para servir: el mariachi-nginx debe montar este dist en /sieej/"

down:
	@$(COMPOSE_DEV) --profile dev down 2>/dev/null || true
	@echo "Servicios de desarrollo detenidos"

clean: down
	@$(COMPOSE_DEV) --profile dev down -v --remove-orphans 2>/dev/null || true
	@$(COMPOSE_BUILD) --profile build down -v --remove-orphans 2>/dev/null || true
	@docker run --rm -v $(CURDIR)/frontend/dist:/dist alpine sh -c "rm -rf /dist/*" 2>/dev/null || true
	@rm -rf frontend/dist frontend/node_modules
	@echo "Limpieza completada"

logs:
	@$(COMPOSE_DEV) --profile dev logs -f

status:
	@$(COMPOSE_DEV) ps 2>/dev/null || echo "  No hay servicios corriendo"
