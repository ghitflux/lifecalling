from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import auth, cases, imports, ws as wsmod
from .routers import closing, finance, contracts
from .db import Base, engine
from .routers import simulations

app = FastAPI(title="Lifecalling API")

app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000", "http://localhost:3001"], allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])

# Routers
app.include_router(auth.r)
app.include_router(simulations.r)
app.include_router(cases.r)
app.include_router(closing.r)
app.include_router(finance.r)
app.include_router(contracts.r)
app.include_router(imports.r)
app.include_router(wsmod.ws_router)

# Bootstrap DB (migrations via alembic, mas garantimos a existência)
Base.metadata.create_all(bind=engine)


