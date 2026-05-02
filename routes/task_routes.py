from flask import Blueprint, request, jsonify
from db import db
from models.models import Task
from middleware.auth_middleware import auth_required, admin_required
from datetime import datetime

task_bp = Blueprint("tasks", __name__)

@task_bp.route("/", methods=["POST"])
@auth_required
@admin_required
def create_task():
    data = request.json

    title       = data.get("title")
    due_date    = data.get("dueDate") or data.get("due_date")
    assigned_to = data.get("assignedTo") or data.get("assigned_to")
    priority    = data.get("priority", "medium")
    notes       = data.get("notes", "")

    if not title or not due_date or not assigned_to:
        return jsonify({"error": "title, dueDate, and assignedTo are required"}), 400

    task = Task(
        title=title,
        description=notes,
        status="pending",
        dueDate=due_date,
        assignedTo=str(assigned_to).strip()   # stored as the custom user_id string
    )

    db.session.add(task)
    db.session.commit()

    return jsonify({"msg": "Task created"})


@task_bp.route("/", methods=["GET"])
@auth_required
def get_tasks():
    user = request.user
    if user["role"] == "admin":
        tasks = Task.query.all()
    else:
        # Members only see tasks assigned to their custom user_id
        tasks = Task.query.filter_by(assignedTo=user["user_id"]).all()

    result = []
    for t in tasks:
        result.append({
            "_id": t.id,
            "title": t.title,
            "status": t.status,
            "assignedTo": t.assignedTo,
            "dueDate": t.dueDate,
            "priority": getattr(t, "priority", "medium"),
            "notes": t.description or ""
        })

    return jsonify(result)


@task_bp.route("/dashboard", methods=["GET"])
@auth_required
def dashboard():
    user = request.user
    if user["role"] == "admin":
        tasks = Task.query.all()
    else:
        tasks = Task.query.filter_by(assignedTo=user["user_id"]).all()

    total     = len(tasks)
    completed = len([t for t in tasks if t.status == "completed"])

    overdue = 0
    for t in tasks:
        try:
            due = datetime.strptime(t.dueDate, "%Y-%m-%d")
            if due < datetime.now() and t.status != "completed":
                overdue += 1
        except Exception:
            continue

    return jsonify({"total": total, "completed": completed, "overdue": overdue})


@task_bp.route("/<int:task_id>", methods=["PUT"])
@auth_required
def update_task(task_id):
    data = request.json
    user = request.user

    task = Task.query.get(task_id)
    if not task:
        return jsonify({"error": "Task not found"}), 404

    if user["role"] != "admin" and task.assignedTo != user["user_id"]:
        return jsonify({"error": "Access denied"}), 403

    task.status = data.get("status", task.status)
    db.session.commit()
    return jsonify({"msg": "Task updated"})


@task_bp.route("/<int:task_id>", methods=["DELETE"])
@auth_required
@admin_required
def delete_task(task_id):
    task = Task.query.get(task_id)
    if not task:
        return jsonify({"error": "Task not found"}), 404

    db.session.delete(task)
    db.session.commit()
    return jsonify({"msg": "Task deleted"}), 200
