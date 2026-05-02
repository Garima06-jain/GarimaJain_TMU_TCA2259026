from flask import Blueprint, request, jsonify
from flask_bcrypt import Bcrypt
import jwt
from datetime import datetime, timedelta
from config import Config
from db import db
from models.models import User

auth_bp = Blueprint("auth", __name__)
bcrypt = Bcrypt()

@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.json

    if not data.get("user_id") or not data.get("name") or not data.get("email") or not data.get("password"):
        return jsonify({"error": "All fields required"}), 400

    if User.query.filter_by(user_id=data["user_id"]).first():
        return jsonify({"error": "User ID already taken. Please choose another."}), 400

    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "Email already exists"}), 400

    hashed = bcrypt.generate_password_hash(data["password"]).decode("utf-8")

    user = User(
        user_id=data["user_id"].strip(),
        name=data["name"],
        email=data["email"],
        password=hashed,
        role=data.get("role", "member")
    )

    db.session.add(user)
    db.session.commit()

    return jsonify({"msg": "User created"})


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json

    user_id = data.get("user_id", "").strip()
    password = data.get("password", "")

    if not user_id or not password:
        return jsonify({"error": "User ID and password are required"}), 400

    user = User.query.filter_by(user_id=user_id).first()

    if not user:
        return jsonify({"error": "User ID not found"}), 404

    if not bcrypt.check_password_hash(user.password, password):
        return jsonify({"error": "Wrong password"}), 400

    token = jwt.encode({
        "id": user.id,
        "user_id": user.user_id,
        "name": user.name,
        "role": user.role,
        "exp": datetime.utcnow() + timedelta(hours=2)
    }, Config.SECRET_KEY, algorithm="HS256")

    return jsonify({"token": token})
