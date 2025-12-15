from flask import Flask, render_template, send_from_directory, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os
import pandas as pd
from fpdf import FPDF
from fpdf import FPDF
from fpdf.enums import XPos, YPos

app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app)

# إعدادات قاعدة البيانات
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///housing_system.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'your-secret-key-here'

db = SQLAlchemy(app)

# نماذج قاعدة البيانات
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    name = db.Column(db.String(120), nullable=False)
    role = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Building(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(50), nullable=False)
    location = db.Column(db.String(100), nullable=False)
    units_count = db.Column(db.Integer, default=0)

class Resident(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    national_id = db.Column(db.String(20), unique=True)
    phone = db.Column(db.String(20))
    unit_number = db.Column(db.String(50))
    building_id = db.Column(db.Integer, db.ForeignKey('building.id'))

class Parking(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    parking_number = db.Column(db.String(50), unique=True, nullable=False)
    status = db.Column(db.String(50), default='available')
    resident_id = db.Column(db.Integer, db.ForeignKey('resident.id'))
    building_id = db.Column(db.Integer, db.ForeignKey('building.id'))

class Violation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    resident_id = db.Column(db.Integer, db.ForeignKey('resident.id'))
    violation_type = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    date = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(50), default='open')
    amount = db.Column(db.Float, default=0.0)

class Complaint(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    resident_id = db.Column(db.Integer, db.ForeignKey('resident.id'))
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(100))
    status = db.Column(db.String(50), default='pending')
    priority = db.Column(db.String(50), default='medium')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class TrafficAccident(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.DateTime, nullable=False)
    location = db.Column(db.String(200), nullable=False)
    reporter_name = db.Column(db.String(120), nullable=False)
    reporter_phone = db.Column(db.String(20), nullable=False)
    involved_parties = db.Column(db.String(50))
    severity = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(50), default='investigating')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# إنشاء قاعدة البيانات
with app.app_context():
    db.create_all()
    
    # إضافة مستخدمين افتراضيين إذا لم يكونوا موجودين
    if User.query.count() == 0:
        admin = User(username='admin', password='admin123', name='مدير النظام', role='admin')
        violations_officer = User(username='violations_officer', password='violations123', name='مسؤول المخالفات', role='violations_officer')
        visitors_officer = User(username='visitors_officer', password='visitors123', name='مسؤول الزوار', role='visitors_officer')
        
        db.session.add(admin)
        db.session.add(violations_officer)
        db.session.add(visitors_officer)
        db.session.commit()

# المسارات
@app.route('/')
def index():
    return send_from_directory('static', 'login.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)

# API للمستخدمين
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(username=data['username'], password=data['password']).first()
    if user:
        return jsonify({
            'success': True,
            'user': {
                'id': user.id,
                'username': user.username,
                'name': user.name,
                'role': user.role
            }
        })
    return jsonify({'success': False, 'message': 'اسم المستخدم أو كلمة المرور غير صحيحة'}), 401

@app.route('/api/users', methods=['GET'])
def get_users():
    users = User.query.all()
    return jsonify([{
        'id': u.id,
        'username': u.username,
        'name': u.name,
        'role': u.role,
        'created_at': u.created_at.isoformat()
    } for u in users])

@app.route('/api/users', methods=['POST'])
def create_user():
    data = request.json
    user = User(
        username=data['username'],
        password=data['password'],
        name=data['name'],
        role=data['role']
    )
    db.session.add(user)
    db.session.commit()
    return jsonify({'success': True, 'message': 'تم إضافة المستخدم بنجاح'})

@app.route('/api/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    user = User.query.get_or_404(user_id)
    data = request.json
    user.name = data.get('name', user.name)
    user.role = data.get('role', user.role)
    if 'password' in data and data['password']:
        user.password = data['password']
    db.session.commit()
    return jsonify({'success': True, 'message': 'تم تحديث المستخدم بنجاح'})

@app.route('/api/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    return jsonify({'success': True, 'message': 'تم حذف المستخدم بنجاح'})

@app.route('/api/users/export/<format>', methods=['GET'])
def export_users(format):
    users = User.query.all()
    data = [{
        'الرقم': u.id,
        'اسم المستخدم': u.username,
        'الاسم الكامل': u.name,
        'الدور': u.role,
        'تاريخ الإنشاء': u.created_at.isoformat()
    } for u in users]

    df = pd.DataFrame(data)

    if format == 'excel':
        excel_path = os.path.join(app.root_path, 'static', 'users_report.xlsx')
        df.to_excel(excel_path, index=False)
        return send_from_directory(os.path.join(app.root_path, 'static'), 'users_report.xlsx', as_attachment=True)
    
    elif format == 'pdf':
        pdf = FPDF(orientation='L', unit='mm', format='A4')
        pdf.add_font('Amiri', '', 'Amiri-Regular.ttf', uni=True)
        pdf.add_font('Amiri', 'B', 'Amiri-Bold.ttf', uni=True)
        pdf.set_auto_page_break(auto=True, margin=15)
        pdf.add_page()
        pdf.set_font('Amiri', 'B', 12)
        
        # Add a font that supports Arabic (e.g., DejaVuSans)
        # Note: fpdf2 is not installed, using FPDF which might not support Arabic out of the box.
        # For a proper Arabic PDF, we need to use a library like fpdf2 with a proper font.
        # Assuming fpdf is a placeholder for a library that supports Arabic text.
        # For now, we will use a basic structure and inform the user about the Arabic font issue.
        
        pdf.cell(0, 10, 'تقرير المستخدمين', 0, 1, 'C')
        
        col_widths = [20, 40, 50, 40, 60]
        
        # Table Header
        for i, header in enumerate(df.columns):
            pdf.cell(col_widths[i], 10, header, 1, 0, 'C')
        pdf.ln()
        
        # Table Rows
        pdf.set_font('Amiri', '', 10)
        for row in data:
            pdf.cell(col_widths[0], 10, str(row['الرقم']), 1, 0, 'C')
            pdf.cell(col_widths[1], 10, row['اسم المستخدم'], 1, 0, 'C')
            pdf.cell(col_widths[2], 10, row['الاسم الكامل'], 1, 0, 'C')
            pdf.cell(col_widths[3], 10, row['الدور'], 1, 0, 'C')
            pdf.cell(col_widths[4], 10, row['تاريخ الإنشاء'], 1, 0, 'C')
            pdf.ln()

        pdf_path = os.path.join(app.root_path, 'static', 'users_report.pdf')
        pdf.output(pdf_path)
        return send_from_directory(os.path.join(app.root_path, 'static'), 'users_report.pdf', as_attachment=True)

    return jsonify({'success': False, 'message': 'صيغة التصدير غير مدعومة'}), 400

# API للشكاوى
@app.route('/api/complaints', methods=['GET'])
def get_complaints():
    complaints = Complaint.query.all()
    return jsonify([{
        'id': c.id,
        'title': c.title,
        'description': c.description,
        'category': c.category,
        'status': c.status,
        'priority': c.priority,
        'created_at': c.created_at.isoformat()
    } for c in complaints])

@app.route('/api/complaints', methods=['POST'])
def create_complaint():
    data = request.json
    complaint = Complaint(
        resident_id=data.get('resident_id'),
        title=data['title'],
        description=data['description'],
        category=data.get('category'),
        priority=data.get('priority', 'medium')
    )
    db.session.add(complaint)
    db.session.commit()
    return jsonify({'success': True, 'message': 'تم تسجيل الشكوى بنجاح'})

# API للحوادث المرورية
@app.route('/api/accidents', methods=['GET'])
def get_accidents():
    accidents = TrafficAccident.query.order_by(TrafficAccident.date.desc()).all()
    return jsonify([{
        'id': a.id,
        'date': a.date.isoformat(),
        'location': a.location,
        'reporter_name': a.reporter_name,
        'reporter_phone': a.reporter_phone,
        'involved_parties': a.involved_parties,
        'severity': a.severity,
        'description': a.description,
        'status': a.status
    } for a in accidents])

@app.route('/api/accidents', methods=['POST'])
def create_accident():
    data = request.json
    accident = TrafficAccident(
        date=datetime.fromisoformat(data['date']),
        location=data['location'],
        reporter_name=data['reporter_name'],
        reporter_phone=data['reporter_phone'],
        involved_parties=data.get('involved_parties'),
        severity=data['severity'],
        description=data['description']
    )
    db.session.add(accident)
    db.session.commit()
    return jsonify({'success': True, 'message': 'تم تسجيل الحادث بنجاح'})

# API للإحصائيات
@app.route('/api/stats', methods=['GET'])
def get_stats():
    return jsonify({
        'buildings_count': Building.query.count(),
        'residents_count': Resident.query.count(),
        'parking_count': Parking.query.count(),
        'violations_count': Violation.query.filter_by(status='open').count(),
        'complaints_count': Complaint.query.filter_by(status='pending').count(),
        'accidents_count': TrafficAccident.query.count()
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)

