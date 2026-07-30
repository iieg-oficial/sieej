.PHONY: setup

##@ SIEEJ

setup: ## Crear el .env.development desde el ejemplo
	@$(LIB)
	if [ ! -f .env.development ]; then
		cp .env.example .env.development
		row 'Env' 'creado' "$$C_GREEN" 'edita .env.development'
	fi
