import os

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "supersecret123")
    SQLALCHEMY_DATABASE_URI = "sqlite:///database.db"
    SQLALCHEMY_TRACK_MODIFICATIONS = False