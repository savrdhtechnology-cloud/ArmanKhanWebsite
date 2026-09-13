from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import uuid
import logging
import bcrypt
import jwt
import httpx
from html import escape
from datetime import datetime, timezone, timedelta
from typing import Optional, List

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr

# ---------------- Setup ----------------
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALG = "HS256"

EMAIL_BASE_URL = "https://integrations.emergentagent.com"
EMAIL_KEY = os.environ.get("EMERGENT_EMAIL_KEY", "")
EMAIL_FROM_NAME = os.environ.get("EMAIL_FROM_NAME", "Arman Hair Studio")
OWNER_EMAIL = os.environ.get("OWNER_EMAIL", "admin@armanhairstudio.com")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI(title="Arman Hair Studio API")
api = APIRouter(prefix="/api")

# ---------------- Utils ----------------
def hash_password(p: str) -> str:
    return bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()

def verify_password(p: str, h: str) -> bool:
    try:
        return bcrypt.checkpw(p.encode(), h.encode())
    except Exception:
        return False

def create_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id, "email": email, "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

async def get_admin_user(request: Request) -> dict:
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

async def get_staff_user(request: Request) -> dict:
    """Staff OR admin (admin can do everything staff can)."""
    user = await get_current_user(request)
    if user.get("role") not in ("staff", "admin"):
        raise HTTPException(status_code=403, detail="Staff access required")
    return user

def set_auth_cookie(response: Response, token: str):
    response.set_cookie(
        key="access_token", value=token, httponly=True, secure=True,
        samesite="none", max_age=7 * 24 * 3600, path="/",
    )

# ---------------- Email ----------------
async def send_email(*, to: str, subject: str, html: str) -> Optional[str]:
    if not EMAIL_KEY:
        logger.warning("Email key not set, skipping send")
        return None
    payload = {
        "to": [to], "subject": subject, "html": html,
        "from_name": EMAIL_FROM_NAME,
    }
    try:
        async with httpx.AsyncClient(timeout=20) as c:
            r = await c.post(
                f"{EMAIL_BASE_URL}/api/v1/email/send",
                headers={"X-Email-Key": EMAIL_KEY}, json=payload,
            )
        r.raise_for_status()
        return r.json().get("id")
    except Exception as e:
        logger.error(f"Email send failed: {e}")
        return None

def _email_shell(inner_html: str) -> str:
    return (
        '<table role="presentation" width="100%" style="background:#050505;padding:40px 0;">'
        '<tr><td align="center">'
        '<table role="presentation" width="600" style="background:#111111;border:1px solid rgba(201,169,97,0.3);">'
        '<tr><td style="padding:32px;font-family:Arial,sans-serif;color:#ffffff;">'
        f'<h1 style="color:#C9A961;font-family:Georgia,serif;font-size:28px;margin:0 0 8px;">Arman Hair Studio</h1>'
        f'<p style="color:#A3A3A3;font-size:13px;letter-spacing:2px;text-transform:uppercase;margin:0 0 24px;">The Art of Hair</p>'
        f'{inner_html}'
        f'<p style="font-size:12px;color:#737373;margin-top:32px;border-top:1px solid rgba(255,255,255,0.08);padding-top:16px;">'
        f'Sent by {escape(EMAIL_FROM_NAME)}. Bhopal, Madhya Pradesh, India. We never ask for your password by email.'
        '</p></td></tr></table></td></tr></table>'
    )

# ---------------- Models ----------------
class RegisterIn(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class AppointmentIn(BaseModel):
    name: str
    phone: str
    email: EmailStr
    service: str
    date: str
    time: str
    message: Optional[str] = ""

class StatusUpdateIn(BaseModel):
    status: str  # pending, confirmed, cancelled, completed
    admin_note: Optional[str] = ""

class AssignIn(BaseModel):
    staff_id: Optional[str] = None  # None to unassign

class FollowUpIn(BaseModel):
    follow_up_at: Optional[str] = None  # ISO datetime string
    follow_up_note: Optional[str] = ""

class StaffCreateIn(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = ""
    password: str

class ProfileUpdateIn(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None

# ---------------- Auth Routes ----------------
@api.post("/auth/register")
async def register(inp: RegisterIn, response: Response):
    email = inp.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    uid = str(uuid.uuid4())
    doc = {
        "id": uid, "email": email, "name": inp.name, "phone": inp.phone or "",
        "role": "customer", "password_hash": hash_password(inp.password),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(doc)
    token = create_token(uid, email, "customer")
    set_auth_cookie(response, token)
    return {"id": uid, "email": email, "name": inp.name, "phone": inp.phone or "", "role": "customer", "token": token}

@api.post("/auth/login")
async def login(inp: LoginIn, response: Response):
    email = inp.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(inp.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_token(user["id"], email, user["role"])
    set_auth_cookie(response, token)
    return {
        "id": user["id"], "email": user["email"], "name": user["name"],
        "phone": user.get("phone", ""), "role": user["role"], "token": token,
    }

@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}

@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user

@api.patch("/auth/profile")
async def update_profile(inp: ProfileUpdateIn, user: dict = Depends(get_current_user)):
    update = {k: v for k, v in inp.model_dump(exclude_none=True).items()}
    if update:
        await db.users.update_one({"id": user["id"]}, {"$set": update})
    return await db.users.find_one({"id": user["id"]}, {"_id": 0, "password_hash": 0})

# ---------------- Appointments ----------------
@api.post("/appointments")
async def create_appointment(inp: AppointmentIn, request: Request):
    # Optional: link user if logged in
    user_id = None
    token = request.cookies.get("access_token") or ""
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if token:
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
            user_id = payload.get("sub")
        except Exception:
            user_id = None

    aid = str(uuid.uuid4())
    # Round-robin auto-assign to next staff (if enabled)
    assigned_to = None
    assigned_to_name = None
    settings = await db.settings.find_one({"id": "global"}, {"_id": 0})
    auto_enabled = True if not settings else settings.get("auto_assign_enabled", True)
    if auto_enabled:
        staff_pool = await db.users.find(
            {"role": "staff"}, {"_id": 0, "password_hash": 0}
        ).sort("created_at", 1).to_list(200)
        if staff_pool:
            last_idx = -1 if not settings else settings.get("last_assigned_index", -1)
            next_idx = (last_idx + 1) % len(staff_pool)
            picked = staff_pool[next_idx]
            assigned_to = picked["id"]
            assigned_to_name = picked["name"]
            await db.settings.update_one(
                {"id": "global"},
                {"$set": {"last_assigned_index": next_idx, "auto_assign_enabled": True}},
                upsert=True,
            )

    doc = {
        "id": aid, "name": inp.name, "phone": inp.phone, "email": inp.email.lower(),
        "service": inp.service, "date": inp.date, "time": inp.time,
        "message": inp.message or "", "status": "pending", "admin_note": "",
        "user_id": user_id, "assigned_to": assigned_to, "assigned_to_name": assigned_to_name,
        "follow_up_at": None, "follow_up_note": "",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.appointments.insert_one(doc)

    # Customer email
    cust_html = _email_shell(
        f'<h2 style="color:#ffffff;font-family:Georgia,serif;">Booking Received</h2>'
        f'<p>Dear {escape(inp.name)},</p>'
        f'<p>Your appointment request has been received successfully. Our team at Arman Hair Studio will confirm your appointment shortly via call or WhatsApp.</p>'
        f'<table style="width:100%;margin:16px 0;border-collapse:collapse;">'
        f'<tr><td style="padding:8px;color:#A3A3A3;">Service</td><td style="padding:8px;color:#C9A961;">{escape(inp.service)}</td></tr>'
        f'<tr><td style="padding:8px;color:#A3A3A3;">Date</td><td style="padding:8px;color:#C9A961;">{escape(inp.date)}</td></tr>'
        f'<tr><td style="padding:8px;color:#A3A3A3;">Time</td><td style="padding:8px;color:#C9A961;">{escape(inp.time)}</td></tr>'
        f'</table>'
        f'<p>For urgent bookings, WhatsApp us at <strong style="color:#C9A961;">8878356060</strong>.</p>'
        f'<p>Warm regards,<br/>Arman Khan<br/>Founder</p>'
    )
    await send_email(to=inp.email, subject="Booking Received - Arman Hair Studio", html=cust_html)

    # Admin notification
    admin_html = _email_shell(
        f'<h2 style="color:#ffffff;font-family:Georgia,serif;">New Appointment Lead Received</h2>'
        f'<table style="width:100%;margin:16px 0;border-collapse:collapse;">'
        f'<tr><td style="padding:8px;color:#A3A3A3;">Name</td><td style="padding:8px;color:#ffffff;">{escape(inp.name)}</td></tr>'
        f'<tr><td style="padding:8px;color:#A3A3A3;">Phone</td><td style="padding:8px;color:#ffffff;">{escape(inp.phone)}</td></tr>'
        f'<tr><td style="padding:8px;color:#A3A3A3;">Email</td><td style="padding:8px;color:#ffffff;">{escape(inp.email)}</td></tr>'
        f'<tr><td style="padding:8px;color:#A3A3A3;">Service</td><td style="padding:8px;color:#C9A961;">{escape(inp.service)}</td></tr>'
        f'<tr><td style="padding:8px;color:#A3A3A3;">Date</td><td style="padding:8px;color:#C9A961;">{escape(inp.date)}</td></tr>'
        f'<tr><td style="padding:8px;color:#A3A3A3;">Time</td><td style="padding:8px;color:#C9A961;">{escape(inp.time)}</td></tr>'
        f'<tr><td style="padding:8px;color:#A3A3A3;">Note</td><td style="padding:8px;color:#ffffff;">{escape(inp.message or "-")}</td></tr>'
        f'</table>'
        f'<p>Log in to the admin dashboard to manage this lead.</p>'
    )
    await send_email(to=OWNER_EMAIL, subject="New Appointment Lead - Arman Hair Studio", html=admin_html)

    return {"id": aid, "status": "pending", "message": "Appointment request received"}

@api.get("/appointments/mine")
async def my_appointments(user: dict = Depends(get_current_user)):
    items = await db.appointments.find(
        {"$or": [{"user_id": user["id"]}, {"email": user["email"]}]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(200)
    return items

@api.patch("/appointments/{aid}/cancel")
async def cancel_my_appointment(aid: str, user: dict = Depends(get_current_user)):
    appt = await db.appointments.find_one({"id": aid}, {"_id": 0})
    if not appt:
        raise HTTPException(status_code=404, detail="Not found")
    if appt.get("user_id") != user["id"] and appt.get("email") != user["email"]:
        raise HTTPException(status_code=403, detail="Not your appointment")
    await db.appointments.update_one({"id": aid}, {"$set": {"status": "cancelled"}})
    # Notify customer
    html = _email_shell(
        f'<h2 style="color:#ffffff;font-family:Georgia,serif;">Appointment Cancelled</h2>'
        f'<p>Dear {escape(appt["name"])},</p>'
        f'<p>Your appointment on <strong style="color:#C9A961;">{escape(appt["date"])} at {escape(appt["time"])}</strong> has been cancelled as requested.</p>'
        f'<p>We hope to see you again soon.</p>'
    )
    await send_email(to=appt["email"], subject="Appointment Cancelled - Arman Hair Studio", html=html)
    return {"ok": True}

# ---------------- Admin ----------------
@api.get("/admin/stats")
async def admin_stats(user: dict = Depends(get_admin_user)):
    total = await db.appointments.count_documents({})
    pending = await db.appointments.count_documents({"status": "pending"})
    confirmed = await db.appointments.count_documents({"status": "confirmed"})
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    today_count = await db.appointments.count_documents({"date": today})
    customers = await db.users.count_documents({"role": "customer"})
    staff = await db.users.count_documents({"role": "staff"})
    unassigned = await db.appointments.count_documents({"assigned_to": None, "status": {"$in": ["pending", "confirmed"]}})
    return {
        "total_leads": total, "pending": pending, "confirmed": confirmed,
        "today": today_count, "customers": customers, "staff": staff,
        "unassigned": unassigned,
    }

@api.get("/admin/appointments")
async def admin_list_appointments(
    status: Optional[str] = None,
    user: dict = Depends(get_admin_user),
):
    q = {}
    if status:
        q["status"] = status
    items = await db.appointments.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)
    return items

@api.patch("/admin/appointments/{aid}")
async def admin_update_appointment(aid: str, inp: StatusUpdateIn, user: dict = Depends(get_admin_user)):
    if inp.status not in ("pending", "confirmed", "cancelled", "completed"):
        raise HTTPException(status_code=400, detail="Invalid status")
    appt = await db.appointments.find_one({"id": aid}, {"_id": 0})
    if not appt:
        raise HTTPException(status_code=404, detail="Not found")
    await db.appointments.update_one(
        {"id": aid},
        {"$set": {"status": inp.status, "admin_note": inp.admin_note or ""}}
    )

    subj_map = {
        "confirmed": "Appointment Confirmed - Arman Hair Studio",
        "cancelled": "Appointment Cancelled - Arman Hair Studio",
        "completed": "Thank You for Visiting - Arman Hair Studio",
        "pending": "Appointment Update - Arman Hair Studio",
    }
    body_map = {
        "confirmed": "Your appointment is <strong style='color:#C9A961;'>CONFIRMED</strong>. We look forward to seeing you.",
        "cancelled": "Your appointment has been cancelled. Please contact us to reschedule.",
        "completed": "Thank you for visiting Arman Hair Studio. We hope you loved your new look!",
        "pending": "Your appointment status has been updated.",
    }
    html = _email_shell(
        f'<h2 style="color:#ffffff;font-family:Georgia,serif;">Appointment Update</h2>'
        f'<p>Dear {escape(appt["name"])},</p>'
        f'<p>{body_map[inp.status]}</p>'
        f'<table style="width:100%;margin:16px 0;border-collapse:collapse;">'
        f'<tr><td style="padding:8px;color:#A3A3A3;">Service</td><td style="padding:8px;color:#C9A961;">{escape(appt["service"])}</td></tr>'
        f'<tr><td style="padding:8px;color:#A3A3A3;">Date</td><td style="padding:8px;color:#C9A961;">{escape(appt["date"])}</td></tr>'
        f'<tr><td style="padding:8px;color:#A3A3A3;">Time</td><td style="padding:8px;color:#C9A961;">{escape(appt["time"])}</td></tr>'
        f'</table>'
        f'<p>WhatsApp: <strong style="color:#C9A961;">8878356060</strong></p>'
    )
    await send_email(to=appt["email"], subject=subj_map[inp.status], html=html)
    return {"ok": True, "status": inp.status}

@api.get("/admin/customers")
async def admin_customers(user: dict = Depends(get_admin_user)):
    users = await db.users.find({"role": "customer"}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(500)
    # Get appointment counts
    result = []
    for u in users:
        count = await db.appointments.count_documents({"$or": [{"user_id": u["id"]}, {"email": u["email"]}]})
        u["appointment_count"] = count
        result.append(u)
    return result

# ---------------- Staff Performance & Settings ----------------
def _range_for_period(period: str) -> tuple[Optional[str], Optional[str]]:
    """Return (start_iso, end_iso) for a period filter."""
    now = datetime.now(timezone.utc)
    if period == "week":
        start = now - timedelta(days=now.weekday())  # Monday
        start = start.replace(hour=0, minute=0, second=0, microsecond=0)
        return start.isoformat(), None
    if period == "last_week":
        this_monday = (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
        last_monday = this_monday - timedelta(days=7)
        return last_monday.isoformat(), this_monday.isoformat()
    if period == "month":
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        return start.isoformat(), None
    return None, None  # all-time

@api.get("/admin/staff/performance")
async def admin_staff_performance(
    period: str = "week",
    user: dict = Depends(get_admin_user),
):
    start, end = _range_for_period(period)
    date_q = {}
    if start: date_q["$gte"] = start
    if end: date_q["$lt"] = end
    base_q = {"created_at": date_q} if date_q else {}

    staff_list = await db.users.find({"role": "staff"}, {"_id": 0, "password_hash": 0}).to_list(500)
    result = []
    for s in staff_list:
        q = {**base_q, "assigned_to": s["id"]}
        assigned = await db.appointments.count_documents(q)
        confirmed = await db.appointments.count_documents({**q, "status": "confirmed"})
        completed = await db.appointments.count_documents({**q, "status": "completed"})
        cancelled = await db.appointments.count_documents({**q, "status": "cancelled"})
        pending = await db.appointments.count_documents({**q, "status": "pending"})
        # Conversion = (confirmed + completed) / assigned
        conv = round(((confirmed + completed) / assigned * 100), 1) if assigned else 0.0
        result.append({
            "id": s["id"], "name": s["name"], "email": s["email"],
            "assigned": assigned, "confirmed": confirmed, "completed": completed,
            "cancelled": cancelled, "pending": pending, "conversion": conv,
        })

    # Also compute overall (unassigned) for context
    unassigned_q = {**base_q, "assigned_to": None}
    unassigned = await db.appointments.count_documents(unassigned_q)

    # Sort by (completed + confirmed) desc - "winners" first
    result.sort(key=lambda r: (r["completed"] + r["confirmed"], -r["cancelled"]), reverse=True)

    total = await db.appointments.count_documents(base_q)
    return {
        "period": period,
        "start": start, "end": end,
        "total_leads": total, "unassigned": unassigned,
        "leaderboard": result,
    }

@api.get("/admin/settings")
async def admin_get_settings(user: dict = Depends(get_admin_user)):
    doc = await db.settings.find_one({"id": "global"}, {"_id": 0})
    if not doc:
        doc = {"id": "global", "auto_assign_enabled": True, "last_assigned_index": -1}
        await db.settings.insert_one(doc)
    return {"auto_assign_enabled": doc.get("auto_assign_enabled", True)}

@api.patch("/admin/settings")
async def admin_update_settings(payload: dict, user: dict = Depends(get_admin_user)):
    enabled = bool(payload.get("auto_assign_enabled", True))
    await db.settings.update_one(
        {"id": "global"},
        {"$set": {"auto_assign_enabled": enabled}},
        upsert=True,
    )
    return {"auto_assign_enabled": enabled}

# ---------------- Staff Management (Admin) ----------------
@api.get("/admin/staff")
async def admin_list_staff(user: dict = Depends(get_admin_user)):
    staff = await db.users.find({"role": "staff"}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(200)
    result = []
    for s in staff:
        assigned = await db.appointments.count_documents({"assigned_to": s["id"]})
        pending = await db.appointments.count_documents({"assigned_to": s["id"], "status": "pending"})
        s["assigned_count"] = assigned
        s["pending_count"] = pending
        result.append(s)
    return result

@api.post("/admin/staff")
async def admin_create_staff(inp: StaffCreateIn, user: dict = Depends(get_admin_user)):
    email = inp.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    sid = str(uuid.uuid4())
    await db.users.insert_one({
        "id": sid, "email": email, "name": inp.name, "phone": inp.phone or "",
        "role": "staff", "password_hash": hash_password(inp.password),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"id": sid, "email": email, "name": inp.name, "role": "staff"}

@api.delete("/admin/staff/{sid}")
async def admin_delete_staff(sid: str, user: dict = Depends(get_admin_user)):
    await db.users.delete_one({"id": sid, "role": "staff"})
    await db.appointments.update_many({"assigned_to": sid}, {"$set": {"assigned_to": None, "assigned_to_name": None}})
    return {"ok": True}

@api.patch("/admin/appointments/{aid}/assign")
async def admin_assign_appointment(aid: str, inp: AssignIn, user: dict = Depends(get_admin_user)):
    appt = await db.appointments.find_one({"id": aid}, {"_id": 0})
    if not appt:
        raise HTTPException(status_code=404, detail="Not found")
    if inp.staff_id:
        staff = await db.users.find_one({"id": inp.staff_id, "role": "staff"})
        if not staff:
            raise HTTPException(status_code=404, detail="Staff not found")
        await db.appointments.update_one(
            {"id": aid},
            {"$set": {"assigned_to": inp.staff_id, "assigned_to_name": staff["name"]}}
        )
    else:
        await db.appointments.update_one(
            {"id": aid},
            {"$set": {"assigned_to": None, "assigned_to_name": None}}
        )
    return {"ok": True}

# ---------------- Staff Portal ----------------
@api.get("/staff/stats")
async def staff_stats(user: dict = Depends(get_staff_user)):
    my_id = user["id"]
    if user["role"] == "admin":
        # Admin sees all
        my_q = {}
    else:
        my_q = {"assigned_to": my_id}
    total = await db.appointments.count_documents(my_q)
    pending = await db.appointments.count_documents({**my_q, "status": "pending"})
    confirmed = await db.appointments.count_documents({**my_q, "status": "confirmed"})
    completed = await db.appointments.count_documents({**my_q, "status": "completed"})
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    today_count = await db.appointments.count_documents({**my_q, "date": today})
    # Follow-ups due (follow_up_at <= now and not completed/cancelled)
    now_iso = datetime.now(timezone.utc).isoformat()
    followups = await db.appointments.count_documents({
        **my_q, "follow_up_at": {"$ne": None, "$lte": now_iso},
        "status": {"$in": ["pending", "confirmed"]},
    })
    return {
        "total": total, "pending": pending, "confirmed": confirmed,
        "completed": completed, "today": today_count, "followups_due": followups,
    }

@api.get("/staff/appointments")
async def staff_appointments(
    status: Optional[str] = None,
    user: dict = Depends(get_staff_user),
):
    q = {} if user["role"] == "admin" else {"assigned_to": user["id"]}
    if status:
        q["status"] = status
    items = await db.appointments.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)
    return items

@api.patch("/staff/appointments/{aid}/status")
async def staff_update_status(aid: str, inp: StatusUpdateIn, user: dict = Depends(get_staff_user)):
    if inp.status not in ("pending", "confirmed", "cancelled", "completed"):
        raise HTTPException(status_code=400, detail="Invalid status")
    appt = await db.appointments.find_one({"id": aid}, {"_id": 0})
    if not appt:
        raise HTTPException(status_code=404, detail="Not found")
    if user["role"] == "staff" and appt.get("assigned_to") != user["id"]:
        raise HTTPException(status_code=403, detail="Not assigned to you")
    await db.appointments.update_one(
        {"id": aid},
        {"$set": {"status": inp.status, "admin_note": inp.admin_note or appt.get("admin_note", "")}}
    )
    # Send email
    subj_map = {
        "confirmed": "Appointment Confirmed - Arman Hair Studio",
        "cancelled": "Appointment Cancelled - Arman Hair Studio",
        "completed": "Thank You for Visiting - Arman Hair Studio",
        "pending": "Appointment Update - Arman Hair Studio",
    }
    body_map = {
        "confirmed": "Your appointment is <strong style='color:#C9A961;'>CONFIRMED</strong>. We look forward to seeing you.",
        "cancelled": "Your appointment has been cancelled. Please contact us to reschedule.",
        "completed": "Thank you for visiting Arman Hair Studio. We hope you loved your new look!",
        "pending": "Your appointment status has been updated.",
    }
    html = _email_shell(
        f'<h2 style="color:#ffffff;font-family:Georgia,serif;">Appointment Update</h2>'
        f'<p>Dear {escape(appt["name"])},</p>'
        f'<p>{body_map[inp.status]}</p>'
        f'<table style="width:100%;margin:16px 0;border-collapse:collapse;">'
        f'<tr><td style="padding:8px;color:#A3A3A3;">Service</td><td style="padding:8px;color:#C9A961;">{escape(appt["service"])}</td></tr>'
        f'<tr><td style="padding:8px;color:#A3A3A3;">Date</td><td style="padding:8px;color:#C9A961;">{escape(appt["date"])}</td></tr>'
        f'<tr><td style="padding:8px;color:#A3A3A3;">Time</td><td style="padding:8px;color:#C9A961;">{escape(appt["time"])}</td></tr>'
        f'</table>'
    )
    await send_email(to=appt["email"], subject=subj_map[inp.status], html=html)
    return {"ok": True, "status": inp.status}

@api.patch("/staff/appointments/{aid}/followup")
async def staff_set_followup(aid: str, inp: FollowUpIn, user: dict = Depends(get_staff_user)):
    appt = await db.appointments.find_one({"id": aid}, {"_id": 0})
    if not appt:
        raise HTTPException(status_code=404, detail="Not found")
    if user["role"] == "staff" and appt.get("assigned_to") != user["id"]:
        raise HTTPException(status_code=403, detail="Not assigned to you")
    await db.appointments.update_one(
        {"id": aid},
        {"$set": {"follow_up_at": inp.follow_up_at, "follow_up_note": inp.follow_up_note or ""}}
    )
    return {"ok": True}

@api.get("/staff/followups")
async def staff_followups_due(user: dict = Depends(get_staff_user)):
    now_iso = datetime.now(timezone.utc).isoformat()
    q = {"follow_up_at": {"$ne": None, "$lte": now_iso}, "status": {"$in": ["pending", "confirmed"]}}
    if user["role"] != "admin":
        q["assigned_to"] = user["id"]
    items = await db.appointments.find(q, {"_id": 0}).sort("follow_up_at", 1).to_list(200)
    return items

# ---------------- Public ----------------
@api.get("/reviews")
async def get_reviews():
    reviews = await db.reviews.find({}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return reviews

@api.post("/reviews")
async def create_review(payload: dict, user: dict = Depends(get_current_user)):
    rid = str(uuid.uuid4())
    doc = {
        "id": rid, "user_id": user["id"], "name": user["name"],
        "rating": int(payload.get("rating", 5)),
        "comment": str(payload.get("comment", ""))[:500],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.reviews.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}

@api.get("/")
async def root():
    return {"name": "Arman Hair Studio API", "version": "1.0"}

# ---------------- Startup ----------------
@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.appointments.create_index("email")
    await db.appointments.create_index("date")

    admin_email = os.environ["ADMIN_EMAIL"].lower()
    admin_pw = os.environ["ADMIN_PASSWORD"]
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()), "email": admin_email, "name": "Arman Khan",
            "phone": "8878356060", "role": "admin",
            "password_hash": hash_password(admin_pw),
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info("Admin user seeded")
    elif not verify_password(admin_pw, existing["password_hash"]):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_pw), "role": "admin"}}
        )
        logger.info("Admin password updated")

    # Seed demo staff accounts
    demo_staff = [
        {"email": "staff1@armanhairstudio.com", "name": "Priya Sharma", "phone": "9876543211", "password": "Staff@1234"},
        {"email": "staff2@armanhairstudio.com", "name": "Rohit Verma", "phone": "9876543212", "password": "Staff@1234"},
    ]
    for s in demo_staff:
        email = s["email"].lower()
        existing_s = await db.users.find_one({"email": email})
        if not existing_s:
            await db.users.insert_one({
                "id": str(uuid.uuid4()), "email": email, "name": s["name"],
                "phone": s["phone"], "role": "staff",
                "password_hash": hash_password(s["password"]),
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
            logger.info(f"Staff seeded: {email}")
        elif not verify_password(s["password"], existing_s["password_hash"]):
            await db.users.update_one(
                {"email": email},
                {"$set": {"password_hash": hash_password(s["password"]), "role": "staff"}}
            )

    # Seed a demo customer for testing
    demo_cust_email = "customer@example.com"
    if not await db.users.find_one({"email": demo_cust_email}):
        await db.users.insert_one({
            "id": str(uuid.uuid4()), "email": demo_cust_email, "name": "Demo Customer",
            "phone": "9999900000", "role": "customer",
            "password_hash": hash_password("Customer@1234"),
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info("Demo customer seeded")

    # Seed demo reviews if empty
    if await db.reviews.count_documents({}) == 0:
        demo = [
            {"id": str(uuid.uuid4()), "user_id": "seed", "name": "Rahul Sharma",
             "rating": 5, "comment": "Best salon in Bhopal! Arman bhai's signature haircut is world-class. Highly recommended.",
             "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "user_id": "seed", "name": "Priya Verma",
             "rating": 5, "comment": "Amazing keratin treatment. My hair has never felt better. The ambience is absolutely premium.",
             "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "user_id": "seed", "name": "Aditya Singh",
             "rating": 5, "comment": "Went for beard styling and hair colour. Precision work, luxurious experience. Worth every visit.",
             "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "user_id": "seed", "name": "Neha Kapoor",
             "rating": 5, "comment": "Got my bridal hairstyle done here. Absolutely stunning results. Thank you Arman Hair Studio!",
             "created_at": datetime.now(timezone.utc).isoformat()},
        ]
        await db.reviews.insert_many(demo)
        logger.info("Demo reviews seeded")

@app.on_event("shutdown")
async def shutdown():
    client.close()

app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
