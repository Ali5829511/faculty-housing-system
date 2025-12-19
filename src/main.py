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

class Resident(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    national_id = db.Column(db.String(20), unique=True)
    phone = db.Column(db.String(20))
    unit_number = db.Column(db.String(50))
    building_id = db.Column(db.Integer, db.ForeignKey('building.id'))
    
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

# API للمباني
@app.route('/api/buildings', methods=['GET'])
def get_buildings():
    buildings = Building.query.all()
    return jsonify([{
        'id': b.id,
        'name': b.name,
        'type': b.type,
        'location': b.location,
        'units_count': b.units_count
    } for b in buildings])

@app.route('/api/buildings', methods=['POST'])
def create_building():
    data = request.json
    building = Building(
        name=data['name'],
        type=data['type'],
        location=data['location'],
        units_count=data.get('units_count', 0)
    )
    db.session.add(building)
    db.session.commit()
    return jsonify({'success': True, 'message': 'تم إضافة المبنى بنجاح'})

@app.route('/api/buildings/<int:building_id>', methods=['PUT'])
def update_building(building_id):
    building = Building.query.get_or_404(building_id)
    data = request.json
    building.name = data.get('name', building.name)
    building.type = data.get('type', building.type)
    building.location = data.get('location', building.location)
    building.units_count = data.get('units_count', building.units_count)
    db.session.commit()
    return jsonify({'success': True, 'message': 'تم تحديث المبنى بنجاح'})

@app.route('/api/buildings/<int:building_id>', methods=['DELETE'])
def delete_building(building_id):
    building = Building.query.get_or_404(building_id)
    db.session.delete(building)
    db.session.commit()
    return jsonify({'success': True, 'message': 'تم حذف المبنى بنجاح'})

@app.route('/api/residents', methods=['GET'])
def get_residents():
    residents = Resident.query.all()
    return jsonify([{
        'id': r.id,
        'name': r.name,
        'national_id': r.national_id,
        'phone': r.phone,
        'unit_number': r.unit_number,
        'building_id': r.building_id
    } for r in residents])

@app.route('/api/residents', methods=['POST'])
def create_resident():
    data = request.json
    resident = Resident(
        name=data['name'],
        national_id=data.get('national_id'),
        phone=data.get('phone'),
        unit_number=data.get('unit_number'),
        building_id=data.get('building_id')
    )
    db.session.add(resident)
    db.session.commit()
    return jsonify({'success': True, 'message': 'تم إضافة الساكن بنجاح'})

@app.route('/api/residents/<int:resident_id>', methods=['PUT'])
def update_resident(resident_id):
    resident = Resident.query.get_or_404(resident_id)
    data = request.json
    resident.name = data.get('name', resident.name)
    resident.national_id = data.get('national_id', resident.national_id)
    resident.phone = data.get('phone', resident.phone)
    resident.unit_number = data.get('unit_number', resident.unit_number)
    resident.building_id = data.get('building_id', resident.building_id)
    db.session.commit()
    return jsonify({'success': True, 'message': 'تم تحديث بيانات الساكن بنجاح'})

@app.route('/api/residents/<int:resident_id>', methods=['DELETE'])
def delete_resident(resident_id):
    resident = Resident.query.get_or_404(resident_id)
    db.session.delete(resident)
    db.session.commit()
    return jsonify({'success': True, 'message': 'تم حذف الساكن بنجاح'})

@app.route('/api/residents/export/<format>', methods=['GET'])
def export_residents(format):
    residents = Resident.query.all()
    data = [{
        'الرقم': r.id,
        'الاسم': r.name,
        'الهوية الوطنية': r.national_id,
        'الهاتف': r.phone,
        'رقم الوحدة': r.unit_number,
        'رقم المبنى': r.building_id
    } for r in residents]

    df = pd.DataFrame(data)

    if format == 'excel':
        excel_path = os.path.join(app.root_path, 'static', 'residents_report.xlsx')
        df.to_excel(excel_path, index=False)
        return send_from_directory(os.path.join(app.root_path, 'static'), 'residents_report.xlsx', as_attachment=True)
    
    elif format == 'pdf':
        pdf = FPDF(orientation='L', unit='mm', format='A4')
        pdf.add_font('Amiri', '', 'Amiri-Regular.ttf', uni=True)
        pdf.add_font('Amiri', 'B', 'Amiri-Bold.ttf', uni=True)
        pdf.set_auto_page_break(auto=True, margin=15)
        pdf.add_page()
        pdf.set_font('Amiri', 'B', 12)
        
        pdf.cell(0, 10, 'تقرير السكان', 0, 1, 'C')
        
        col_widths = [20, 40, 40, 30, 30, 30]
        
        # Table Header
        headers = ['الرقم', 'الاسم', 'الهوية الوطنية', 'الهاتف', 'رقم الوحدة', 'رقم المبنى']
        for i, header in enumerate(headers):
            pdf.cell(col_widths[i], 10, header, 1, 0, 'C')
        pdf.ln()
        
        # Table Rows
        pdf.set_font('Amiri', '', 10)
        for row in data:
            pdf.cell(col_widths[0], 10, str(row['الرقم']), 1, 0, 'C')
            pdf.cell(col_widths[1], 10, row['الاسم'], 1, 0, 'C')
            pdf.cell(col_widths[2], 10, row['الهوية الوطنية'] or '', 1, 0, 'C')
            pdf.cell(col_widths[3], 10, row['الهاتف'] or '', 1, 0, 'C')
            pdf.cell(col_widths[4], 10, row['رقم الوحدة'] or '', 1, 0, 'C')
            pdf.cell(col_widths[5], 10, str(row['رقم المبنى']) or '', 1, 0, 'C')
            pdf.ln()

        pdf_path = os.path.join(app.root_path, 'static', 'residents_report.pdf')
        pdf.output(pdf_path)
        return send_from_directory(os.path.join(app.root_path, 'static'), 'residents_report.pdf', as_attachment=True)

    return jsonify({'success': False, 'message': 'صيغة التصدير غير مدعومة'}), 400

@app.route('/api/parking', methods=['GET'])
def get_parking():
    parking_spots = Parking.query.all()
    return jsonify([{
        'id': p.id,
        'parking_number': p.parking_number,
        'status': p.status,
        'resident_id': p.resident_id,
        'building_id': p.building_id
    } for p in parking_spots])

@app.route('/api/parking', methods=['POST'])
def create_parking():
    data = request.json
    parking_spot = Parking(
        parking_number=data['parking_number'],
        status=data.get('status', 'available'),
        resident_id=data.get('resident_id'),
        building_id=data.get('building_id')
    )
    db.session.add(parking_spot)
    db.session.commit()
    return jsonify({'success': True, 'message': 'تم إضافة الموقف بنجاح'})

@app.route('/api/parking/<int:parking_id>', methods=['PUT'])
def update_parking(parking_id):
    parking_spot = Parking.query.get_or_404(parking_id)
    data = request.json
    parking_spot.parking_number = data.get('parking_number', parking_spot.parking_number)
    parking_spot.status = data.get('status', parking_spot.status)
    parking_spot.resident_id = data.get('resident_id', parking_spot.resident_id)
    parking_spot.building_id = data.get('building_id', parking_spot.building_id)
    db.session.commit()
    return jsonify({'success': True, 'message': 'تم تحديث بيانات الموقف بنجاح'})

@app.route('/api/parking/<int:parking_id>', methods=['DELETE'])
def delete_parking(parking_id):
    parking_spot = Parking.query.get_or_404(parking_id)
    db.session.delete(parking_spot)
    db.session.commit()
    return jsonify({'success': True, 'message': 'تم حذف الموقف بنجاح'})

@app.route('/api/parking/export/<format>', methods=['GET'])
def export_parking(format):
    parking_spots = Parking.query.all()
    data = [{
        'الرقم': p.id,
        'رقم الموقف': p.parking_number,
        'الحالة': p.status,
        'رقم الساكن': p.resident_id,
        'رقم المبنى': p.building_id
    } for p in parking_spots]

    df = pd.DataFrame(data)

    if format == 'excel':
        excel_path = os.path.join(app.root_path, 'static', 'parking_report.xlsx')
        df.to_excel(excel_path, index=False)
        return send_from_directory(os.path.join(app.root_root, 'static'), 'parking_report.xlsx', as_attachment=True)
    
    elif format == 'pdf':
        pdf = FPDF(orientation='L', unit='mm', format='A4')
        pdf.add_font('Amiri', '', 'Amiri-Regular.ttf', uni=True)
        pdf.add_font('Amiri', 'B', 'Amiri-Bold.ttf', uni=True)
        pdf.set_auto_page_break(auto=True, margin=15)
        pdf.add_page()
        pdf.set_font('Amiri', 'B', 12)
        
        pdf.cell(0, 10, 'تقرير المواقف', 0, 1, 'C')
        
        col_widths = [20, 40, 40, 30, 30]
        
        # Table Header
        headers = ['الرقم', 'رقم الموقف', 'الحالة', 'رقم الساكن', 'رقم المبنى']
        for i, header in enumerate(headers):
            pdf.cell(col_widths[i], 10, header, 1, 0, 'C')
        pdf.ln()
        
        # Table Rows
        pdf.set_font('Amiri', '', 10)
        for row in data:
            pdf.cell(col_widths[0], 10, str(row['الرقم']), 1, 0, 'C')
            pdf.cell(col_widths[1], 10, row['رقم الموقف'], 1, 0, 'C')
            pdf.cell(col_widths[2], 10, row['الحالة'], 1, 0, 'C')
            pdf.cell(col_widths[3], 10, str(row['رقم الساكن']) or '', 1, 0, 'C')
            pdf.cell(col_widths[4], 10, str(row['رقم المبنى']) or '', 1, 0, 'C')
            pdf.ln()

        pdf_path = os.path.join(app.root_path, 'static', 'parking_report.pdf')
        pdf.output(pdf_path)
        return send_from_directory(os.path.join(app.root_path, 'static'), 'parking_report.pdf', as_attachment=True)

    return jsonify({'success': False, 'message': 'صيغة التصدير غير مدعومة'}), 400

@app.route('/api/violations', methods=['GET'])
def get_violations():
    violations = Violation.query.all()
    return jsonify([{
        'id': v.id,
        'resident_id': v.resident_id,
        'violation_type': v.violation_type,
        'description': v.description,
        'date': v.date.isoformat(),
        'status': v.status,
        'amount': v.amount
    } for v in violations])

@app.route('/api/violations', methods=['POST'])
def create_violation():
    data = request.json
    violation = Violation(
        resident_id=data.get('resident_id'),
        violation_type=data['violation_type'],
        description=data.get('description'),
        status=data.get('status', 'open'),
        amount=data.get('amount', 0.0)
    )
    db.session.add(violation)
    db.session.commit()
    return jsonify({'success': True, 'message': 'تم تسجيل المخالفة بنجاح'})

@app.route('/api/violations/<int:violation_id>', methods=['PUT'])
def update_violation(violation_id):
    violation = Violation.query.get_or_404(violation_id)
    data = request.json
    violation.resident_id = data.get('resident_id', violation.resident_id)
    violation.violation_type = data.get('violation_type', violation.violation_type)
    violation.description = data.get('description', violation.description)
    violation.status = data.get('status', violation.status)
    violation.amount = data.get('amount', violation.amount)
    db.session.commit()
    return jsonify({'success': True, 'message': 'تم تحديث بيانات المخالفة بنجاح'})

@app.route('/api/violations/<int:violation_id>', methods=['DELETE'])
def delete_violation(violation_id):
    violation = Violation.query.get_or_404(violation_id)
    db.session.delete(violation)
    db.session.commit()
    return jsonify({'success': True, 'message': 'تم حذف المخالفة بنجاح'})

@app.route('/api/complaints', methods=['GET'])
def get_complaints():
    complaints = Complaint.query.all()
    return jsonify([{
        'id': c.id,
        'resident_id': c.resident_id,
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
        category=data.get('category', 'عام'),
        status=data.get('status', 'pending'),
        priority=data.get('priority', 'medium')
    )
    db.session.add(complaint)
    db.session.commit()
    return jsonify({'success': True, 'message': 'تم تسجيل الشكوى بنجاح'})

@app.route('/api/complaints/<int:complaint_id>', methods=['PUT'])
def update_complaint(complaint_id):
    complaint = Complaint.query.get_or_404(complaint_id)
    data = request.json
    complaint.resident_id = data.get('resident_id', complaint.resident_id)
    complaint.title = data.get('title', complaint.title)
    complaint.description = data.get('description', complaint.description)
    complaint.category = data.get('category', complaint.category)
    complaint.status = data.get('status', complaint.status)
    complaint.priority = data.get('priority', complaint.priority)
    db.session.commit()
    return jsonify({'success': True, 'message': 'تم تحديث بيانات الشكوى بنجاح'})

@app.route('/api/complaints/<int:complaint_id>', methods=['DELETE'])
def delete_complaint(complaint_id):
    complaint = Complaint.query.get_or_404(complaint_id)
    db.session.delete(complaint)
    db.session.commit()
    return jsonify({'success': True, 'message': 'تم حذف الشكوى بنجاح'})

@app.route('/api/complaints/export/<format>', methods=['GET'])
def export_complaints(format):
    complaints = Complaint.query.all()
    data = [{
        'الرقم': c.id,
        'رقم الساكن': c.resident_id,
        'العنوان': c.title,
        'الوصف': c.description,
        'الفئة': c.category,
        'الحالة': c.status,
        'الأولوية': c.priority,
        'تاريخ الإنشاء': c.created_at.isoformat()
    } for c in complaints]

    df = pd.DataFrame(data)

    if format == 'excel':
        excel_path = os.path.join(app.root_path, 'static', 'complaints_report.xlsx')
        df.to_excel(excel_path, index=False)
        return send_from_directory(os.path.join(app.root_path, 'static'), 'complaints_report.xlsx', as_attachment=True)
    
    elif format == 'pdf':
        pdf = FPDF(orientation='L', unit='mm', format='A4')
        pdf.add_font('Amiri', '', 'Amiri-Regular.ttf', uni=True)
        pdf.add_font('Amiri', 'B', 'Amiri-Bold.ttf', uni=True)
        pdf.set_auto_page_break(auto=True, margin=15)
        pdf.add_page()
        pdf.set_font('Amiri', 'B', 12)
        
        pdf.cell(0, 10, 'تقرير الشكاوى', 0, 1, 'C')
        
        col_widths = [15, 20, 40, 50, 20, 20, 20, 30]
        
        # Table Header
        headers = ['الرقم', 'رقم الساكن', 'العنوان', 'الوصف', 'الفئة', 'الحالة', 'الأولوية', 'تاريخ الإنشاء']
        for i, header in enumerate(headers):
            pdf.cell(col_widths[i], 10, header, 1, 0, 'C')
        pdf.ln()
        
        # Table Rows
        pdf.set_font('Amiri', '', 8)
        for row in data:
            pdf.cell(col_widths[0], 10, str(row['الرقم']), 1, 0, 'C')
            pdf.cell(col_widths[1], 10, str(row['رقم الساكن']) or '', 1, 0, 'C')
            pdf.cell(col_widths[2], 10, row['العنوان'], 1, 0, 'C')
            pdf.cell(col_widths[3], 10, row['الوصف'] or '', 1, 0, 'C')
            pdf.cell(col_widths[4], 10, row['الفئة'], 1, 0, 'C')
            pdf.cell(col_widths[5], 10, row['الحالة'], 1, 0, 'C')
            pdf.cell(col_widths[6], 10, row['الأولوية'], 1, 0, 'C')
            pdf.cell(col_widths[7], 10, row['تاريخ الإنشاء'].split('T')[0], 1, 0, 'C')
            pdf.ln()

        pdf_path = os.path.join(app.root_path, 'static', 'complaints_report.pdf')
        pdf.output(pdf_path)
        return send_from_directory(os.path.join(app.root_path, 'static'), 'complaints_report.pdf', as_attachment=True)

    return jsonify({'success': False, 'message': 'صيغة التصدير غير مدعومة'}), 400

@app.route('/api/violations/export/<format>', methods=['GET'])
def export_violations(format):
    violations = Violation.query.all()
    data = [{
        'الرقم': v.id,
        'رقم الساكن': v.resident_id,
        'نوع المخالفة': v.violation_type,
        'الوصف': v.description,
        'التاريخ': v.date.isoformat(),
        'الحالة': v.status,
        'المبلغ': v.amount
    } for v in violations]

    df = pd.DataFrame(data)

    if format == 'excel':
        excel_path = os.path.join(app.root_path, 'static', 'violations_report.xlsx')
        df.to_excel(excel_path, index=False)
        return send_from_directory(os.path.join(app.root_path, 'static'), 'violations_report.xlsx', as_attachment=True)
    
    elif format == 'pdf':
        pdf = FPDF(orientation='L', unit='mm', format='A4')
        pdf.add_font('Amiri', '', 'Amiri-Regular.ttf', uni=True)
        pdf.add_font('Amiri', 'B', 'Amiri-Bold.ttf', uni=True)
        pdf.set_auto_page_break(auto=True, margin=15)
        pdf.add_page()
        pdf.set_font('Amiri', 'B', 12)
        
        pdf.cell(0, 10, 'تقرير المخالفات', 0, 1, 'C')
        
        col_widths = [15, 25, 40, 70, 30, 20, 20]
        
        # Table Header
        headers = ['الرقم', 'رقم الساكن', 'نوع المخالفة', 'الوصف', 'التاريخ', 'الحالة', 'المبلغ']
        for i, header in enumerate(headers):
            pdf.cell(col_widths[i], 10, header, 1, 0, 'C')
        pdf.ln()
        
        # Table Rows
        pdf.set_font('Amiri', '', 10)
        for row in data:
            pdf.cell(col_widths[0], 10, str(row['الرقم']), 1, 0, 'C')
            pdf.cell(col_widths[1], 10, str(row['رقم الساكن']) or '', 1, 0, 'C')
            pdf.cell(col_widths[2], 10, row['نوع المخالفة'], 1, 0, 'C')
            pdf.cell(col_widths[3], 10, row['الوصف'] or '', 1, 0, 'C')
            pdf.cell(col_widths[4], 10, row['التاريخ'].split('T')[0], 1, 0, 'C')
            pdf.cell(col_widths[5], 10, row['الحالة'], 1, 0, 'C')
            pdf.cell(col_widths[6], 10, str(row['المبلغ']), 1, 0, 'C')
            pdf.ln()

        pdf_path = os.path.join(app.root_path, 'static', 'violations_report.pdf')
        pdf.output(pdf_path)
        return send_from_directory(os.path.join(app.root_path, 'static'), 'violations_report.pdf', as_attachment=True)

    return jsonify({'success': False, 'message': 'صيغة التصدير غير مدعومة'}), 400

@app.route('/api/buildings/export/<format>', methods=['GET'])
def export_buildings(format):
    buildings = Building.query.all()
    data = [{
        'الرقم': b.id,
        'الاسم': b.name,
        'النوع': b.type,
        'الموقع': b.location,
        'عدد الوحدات': b.units_count
    } for b in buildings]

    df = pd.DataFrame(data)

    if format == 'excel':
        excel_path = os.path.join(app.root_path, 'static', 'buildings_report.xlsx')
        df.to_excel(excel_path, index=False)
        return send_from_directory(os.path.join(app.root_path, 'static'), 'buildings_report.xlsx', as_attachment=True)
    
    elif format == 'pdf':
        pdf = FPDF(orientation='L', unit='mm', format='A4')
        pdf.add_font('Amiri', '', 'Amiri-Regular.ttf', uni=True)
        pdf.add_font('Amiri', 'B', 'Amiri-Bold.ttf', uni=True)
        pdf.set_auto_page_break(auto=True, margin=15)
        pdf.add_page()
        pdf.set_font('Amiri', 'B', 12)
        
        pdf.cell(0, 10, 'تقرير المباني', 0, 1, 'C')
        
        col_widths = [20, 50, 40, 60, 40]
        
        # Table Header
        headers = ['الرقم', 'الاسم', 'النوع', 'الموقع', 'عدد الوحدات']
        for i, header in enumerate(headers):
            pdf.cell(col_widths[i], 10, header, 1, 0, 'C')
        pdf.ln()
        
        # Table Rows
        pdf.set_font('Amiri', '', 10)
        for row in data:
            pdf.cell(col_widths[0], 10, str(row['الرقم']), 1, 0, 'C')
            pdf.cell(col_widths[1], 10, row['الاسم'], 1, 0, 'C')
            pdf.cell(col_widths[2], 10, row['النوع'], 1, 0, 'C')
            pdf.cell(col_widths[3], 10, row['الموقع'], 1, 0, 'C')
            pdf.cell(col_widths[4], 10, str(row['عدد الوحدات']), 1, 0, 'C')
            pdf.ln()

        pdf_path = os.path.join(app.root_path, 'static', 'buildings_report.pdf')
        pdf.output(pdf_path)
        return send_from_directory(os.path.join(app.root_path, 'static'), 'buildings_report.pdf', as_attachment=True)

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
    app.run(host='0.0.0.0', port=os.environ.get('PORT', 5001), debug=False)

