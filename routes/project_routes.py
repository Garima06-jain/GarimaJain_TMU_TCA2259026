from flask import Blueprint, request, jsonify
from db import db
from models.models import Project
from middleware.auth_middleware import auth_required, admin_required

project_bp = Blueprint("projects", __name__)

@project_bp.route("/", methods=["POST"])
@auth_required
def create_project():
    try:
        data = request.get_json()

        if not data or not data.get("name"):
            return jsonify({"error": "Project name required"}), 400

        project = Project(
            name=data.get("name"),
            description=data.get("description", "")
        )

        db.session.add(project)
        db.session.commit()

        return jsonify({"msg": "Project created"})

    except Exception as e:
        print("ERROR:", e)   # 👈 IMPORTANT
        return jsonify({"error": str(e)}), 500


@project_bp.route("/", methods=["GET"])
@auth_required
def get_projects():
    projects = Project.query.all()

    result = []
    for p in projects:
        result.append({
            "id": p.id,
            "name": p.name,
            "description": p.description
        })

    return jsonify(result)