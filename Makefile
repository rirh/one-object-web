.DEFAULT_GOAL := help

PNPM ?= pnpm

.PHONY: help install dev typecheck build

help:
	@printf "Available targets:\n"
	@printf "  make install       Install dependencies\n"
	@printf "  make dev           Start Vite on port 27526\n"
	@printf "  make typecheck     Run TypeScript checks\n"
	@printf "  make build         Build the production Web bundle\n"

install:
	@$(PNPM) install

dev:
	@$(PNPM) dev

typecheck:
	@$(PNPM) typecheck

build:
	@$(PNPM) build
