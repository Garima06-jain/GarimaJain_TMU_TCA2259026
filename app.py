import os
from dotenv import load_dotenv

load_dotenv()

from flask import Flask, send_from_directory
from flask_cors import CORS
from config import Config

from db import db
app = Flask(__name__)
app.config.from_object(Config)

db.init_app(app)
CORS(app)

from models.models import User, Task, Project

with app.app_context():
    db.create_all()

from routes.auth_routes import auth_bp
from routes.task_routes import task_bp
from routes.project_routes import project_bp

app.register_blueprint(auth_bp, url_prefix="/auth")
app.register_blueprint(task_bp, url_prefix="/tasks")
app.register_blueprint(project_bp, url_prefix="/projects")

@app.route('/')
def home():
    return send_from_directory('frontend', 'index.html')

@app.route('/<path:filename>')
def frontend_static(filename):
    return send_from_directory('frontend', filename)

if __name__ == "__main__":
    app.run(debug=True)
