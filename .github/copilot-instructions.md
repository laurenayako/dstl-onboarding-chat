# AI Coding Agent Instructions for DSTL Onboarding Chat

## Architecture Overview

This is an **onboarding chatbot project** with a **React + TypeScript frontend** (port 8101) and **FastAPI backend** (port 8100).

**Data Model:**
- `Conversation`: Has many `Message`s. Stores `id`, `title`, `created_at`
- `Message`: Belongs to a `Conversation`. Stores `id`, `role` ("user" or "assistant"), `content`, `created_at`

**Data Flow:** Frontend fetches conversations from `/conversations/` endpoint, displays them in a sidebar. User clicks a conversation → fetches `/conversations/{id}` → displays messages in chat area. New messages are POSTed to create new conversations or added to existing ones.

## Development Workflow

### Running the Project
```bash
make backend    # Runs FastAPI server (http://localhost:8100) with auto-reload
make frontend   # Runs Vite dev server (http://localhost:8101) with HMR
```

### Key Dependencies
- **Backend**: FastAPI (async framework), SQLModel (SQLAlchemy + Pydantic), Uvicorn, UV (Python package manager)
- **Frontend**: React 19, TypeScript, Vite with Rolldown, Tailwind CSS, ESLint
- **Database**: SQLite (file: `database.db` in backend directory)

## Code Patterns & Conventions

### Backend (Python)
- **Route structure** (`backend/src/backend/main.py`): FastAPI routes follow REST conventions (POST create, GET read, DELETE delete)
- **Database** (`database.py`): SQLite with SQLModel ORM. Always call `create_db_and_tables()` on startup via lifespan context manager
- **Seeding** (`seed_db()`): Pre-populates test data. Checks if data exists before seeding to avoid duplicates
- **Dependency injection**: Use `Depends(get_session)` for database access in route handlers
- **CORS**: Already configured to allow all origins for frontend communication

### Frontend (React + TypeScript)
- **Styling**: Tailwind CSS utility classes only (no separate CSS files initially)
- **Port**: Dev server runs on 8101 (configured in `vite.config.ts`)
- **Backend communication**: Will need to fetch from `http://localhost:8100` (CORS already enabled)
- **Keyboard interaction**: Enter sends messages (already implemented in `App.tsx`); Shift+Enter for newlines
- **Component structure**: Start with single `App.tsx` component. Add separate components/pages as needed

## Critical Integration Points

1. **Frontend fetching backend**: Use `fetch('http://localhost:8100/conversations/')` (frontend dev server on 8101 needs explicit URL)
2. **Message creation flow**: 
   - User sends message → POST to `/conversations/` if new chat, otherwise add message to existing conversation
   - Response includes created message with `id`, `created_at`, etc.
3. **Conversation sidebar**: Displays list from `GET /conversations/`, clicking one fetches its messages via `GET /conversations/{id}`

## Project-Specific Notes

- **Onboarding context**: This is a learning project with 4 ordered features to implement (view messages, new chat/send, LLM backend, markdown rendering)
- **Hardcoded responses**: Frontend currently returns hard-coded assistant messages; will integrate real LLM API later
- **Empty backend endpoints**: Only basic CRUD exists; message endpoints will be added as features are implemented
- **Database persistence**: Runs via `database.db` in backend; survives server restarts but not file deletion
- **Python version**: Backend requires Python >=3.13 (see `pyproject.toml`)
