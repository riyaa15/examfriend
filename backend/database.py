import os
from dotenv import load_dotenv
load_dotenv()
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

import os
from dotenv import load_dotenv
load_dotenv()
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Database URL configuration
DATABASE_URL = os.getenv("DATABASE_URL")

# Render & Heroku use postgres:// which SQLAlchemy 1.4+ does not accept
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Persistent absolute path for SQLite
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SQLITE_PATH = os.path.join(BASE_DIR, "examfriend.db")

engine = None

if DATABASE_URL:
    try:
        engine = create_engine(DATABASE_URL, pool_pre_ping=True)
        with engine.connect() as conn:
            pass
        print("Connected to PostgreSQL Database successfully!")
    except Exception as e:
        print(f"Warning: PostgreSQL connection failed ({e}). Falling back to persistent SQLite.")
        engine = None

if engine is None:
    DATABASE_URL = f"sqlite:///{SQLITE_PATH}"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
    print(f"Using persistent SQLite database at: {SQLITE_PATH}")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
