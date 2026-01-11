from sqlalchemy import create_engine, text
from app.models import Base
from app.database import DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME
import pymysql

def init_db():
    # Connect to MySQL server (without selecting DB) to create DB if not exists
    server_url = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}"
    engine = create_engine(server_url)
    
    with engine.connect() as conn:
        print(f"Creating database {DB_NAME} if not exists...")
        conn.execute(text(f"CREATE DATABASE IF NOT EXISTS {DB_NAME}"))
        print("Database checked/created.")

    # Now connect to the specific database to create tables
    db_url = f"{server_url}/{DB_NAME}"
    db_engine = create_engine(db_url)
    
    print("Creating tables...")
    Base.metadata.create_all(bind=db_engine)
    print("Tables created successfully.")

if __name__ == "__main__":
    init_db()
