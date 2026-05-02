import jwt
from flask import request, jsonify
from config import Config

def auth_required(f):
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization")

        if not auth_header or " " not in auth_header:
            return jsonify({"error": "Token missing"}), 401

        token = auth_header.split(" ")[1]

        if not token:
            return jsonify({"error": "Token missing"}), 401

        try:
            request.user = jwt.decode(token, Config.SECRET_KEY, algorithms=["HS256"])
        except:
            return jsonify({"error": "Invalid token"}), 401

        return f(*args, **kwargs)

    wrapper.__name__ = f.__name__
    return wrapper


def admin_required(f):
    def wrapper(*args, **kwargs):
        if request.user["role"] != "admin":
            return jsonify({"error": "Admin only"}), 403
        return f(*args, **kwargs)

    wrapper.__name__ = f.__name__
    return wrapper