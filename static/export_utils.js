// مكتبة مشتركة لمميزات التصدير والتعديل
class ExportUtils {
    
    // تصدير البيانات إلى PDF
    static exportToPDF(data, title, filename) {
        // التحقق من وجود مكتبة jsPDF
        if (typeof window.jspdf === 'undefined') {
            console.error('مكتبة jsPDF غير متوفرة');
            alert('خطأ: مكتبة التصدير غير متوفرة');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // إعداد الخط العربي
        doc.setFont('Arial', 'normal');
        doc.setFontSize(16);
        
        // إضافة العنوان
        doc.text(title, 105, 20, { align: 'center' });
        doc.setFontSize(12);
        
        let yPosition = 40;
        const lineHeight = 8;
        const pageHeight = 280;
        
        // إضافة البيانات
        data.forEach((item, index) => {
            if (yPosition > pageHeight) {
                doc.addPage();
                yPosition = 20;
            }
            
            // تحويل الكائن إلى نص
            const itemText = this.objectToText(item, index + 1);
            const lines = doc.splitTextToSize(itemText, 180);
            
            lines.forEach(line => {
                if (yPosition > pageHeight) {
                    doc.addPage();
                    yPosition = 20;
                }
                doc.text(line, 15, yPosition);
                yPosition += lineHeight;
            });
            
            yPosition += 5; // مسافة بين العناصر
        });
        
        // إضافة تاريخ التصدير
        doc.setFontSize(10);
        doc.text(`تاريخ التصدير: ${new Date().toLocaleDateString('ar-SA')}`, 15, doc.internal.pageSize.height - 10);
        
        // حفظ الملف
        doc.save(filename || 'تقرير.pdf');
    }
    
    // تصدير البيانات إلى Excel
    static exportToExcel(data, title, filename) {
        // التحقق من وجود مكتبة XLSX
        if (typeof XLSX === 'undefined') {
            console.error('مكتبة XLSX غير متوفرة');
            alert('خطأ: مكتبة التصدير غير متوفرة');
            return;
        }
        
        // تحويل البيانات إلى تنسيق Excel
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, title);
        
        // حفظ الملف
        XLSX.writeFile(wb, filename || 'تقرير.xlsx');
    }
    
    // تحويل كائن إلى نص للعرض في PDF
    static objectToText(obj, index) {
        let text = `${index}. `;
        
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value !== 'object') {
                text += `${this.translateKey(key)}: ${value} | `;
            }
        }
        
        return text.slice(0, -3); // إزالة آخر " | "
    }
    
    // ترجمة مفاتيح الكائنات إلى العربية
    static translateKey(key) {
        const translations = {
            'id': 'المعرف',
            'name': 'الاسم',
            'fullName': 'الاسم الكامل',
            'username': 'اسم المستخدم',
            'email': 'البريد الإلكتروني',
            'phone': 'الهاتف',
            'role': 'الدور',
            'status': 'الحالة',
            'building': 'المبنى',
            'apartment': 'الشقة',
            'villa': 'الفلة',
            'parking': 'الموقف',
            'plateNumber': 'رقم اللوحة',
            'violationType': 'نوع المخالفة',
            'violationDate': 'تاريخ المخالفة',
            'amount': 'المبلغ',
            'paid': 'مدفوعة',
            'description': 'الوصف',
            'location': 'الموقع',
            'date': 'التاريخ',
            'time': 'الوقت',
            'type': 'النوع',
            'unitType': 'نوع الوحدة',
            'unitNumber': 'رقم الوحدة',
            'buildingNumber': 'رقم المبنى',
            'parkingNumber': 'رقم الموقف',
            'isAvailable': 'متاح',
            'isOccupied': 'مشغول',
            'lastLogin': 'آخر دخول',
            'permissions': 'الصلاحيات',
            'createdAt': 'تاريخ الإنشاء',
            'updatedAt': 'تاريخ التحديث'
        };
        
        return translations[key] || key;
    }
    
    // إضافة أزرار التصدير إلى صفحة
    static addExportButtons(containerId, data, title, filename) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`العنصر ${containerId} غير موجود`);
            return;
        }
        
        const exportDiv = document.createElement('div');
        exportDiv.className = 'export-buttons';
        exportDiv.style.cssText = `
            display: flex;
            gap: 10px;
            margin: 20px 0;
            flex-wrap: wrap;
        `;
        
        // زر تصدير PDF
        const pdfBtn = document.createElement('button');
        pdfBtn.className = 'btn btn-danger';
        pdfBtn.innerHTML = '<i class="fas fa-file-pdf"></i> تصدير PDF';
        pdfBtn.onclick = () => this.exportToPDF(data, title, `${filename}.pdf`);
        
        // زر تصدير Excel
        const excelBtn = document.createElement('button');
        excelBtn.className = 'btn btn-success';
        excelBtn.innerHTML = '<i class="fas fa-file-excel"></i> تصدير Excel';
        excelBtn.onclick = () => this.exportToExcel(data, title, `${filename}.xlsx`);
        
        exportDiv.appendChild(pdfBtn);
        exportDiv.appendChild(excelBtn);
        container.insertBefore(exportDiv, container.firstChild);
    }
}

// فئة لإدارة العمليات CRUD
class CRUDManager {
    constructor(dataKey, itemName) {
        this.dataKey = dataKey;
        this.itemName = itemName;
        this.data = this.loadData();
    }
    
    // تحميل البيانات من localStorage
    loadData() {
        const stored = localStorage.getItem(this.dataKey);
        return stored ? JSON.parse(stored) : [];
    }
    
    // حفظ البيانات في localStorage
    saveData() {
        localStorage.setItem(this.dataKey, JSON.stringify(this.data));
    }
    
    // إضافة عنصر جديد
    create(item) {
        // إنشاء معرف فريد
        item.id = this.generateId();
        item.createdAt = new Date().toISOString();
        item.updatedAt = new Date().toISOString();
        
        this.data.push(item);
        this.saveData();
        return item;
    }
    
    // قراءة جميع العناصر
    readAll() {
        return this.data;
    }
    
    // قراءة عنصر واحد
    readOne(id) {
        return this.data.find(item => item.id === id);
    }
    
    // تحديث عنصر
    update(id, updates) {
        const index = this.data.findIndex(item => item.id === id);
        if (index !== -1) {
            this.data[index] = { ...this.data[index], ...updates, updatedAt: new Date().toISOString() };
            this.saveData();
            return this.data[index];
        }
        return null;
    }
    
    // حذف عنصر
    delete(id) {
        const index = this.data.findIndex(item => item.id === id);
        if (index !== -1) {
            const deleted = this.data.splice(index, 1)[0];
            this.saveData();
            return deleted;
        }
        return null;
    }
    
    // البحث في البيانات
    search(query, fields = []) {
        if (!query) return this.data;
        
        const lowerQuery = query.toLowerCase();
        return this.data.filter(item => {
            if (fields.length === 0) {
                // البحث في جميع الحقول
                return Object.values(item).some(value => 
                    String(value).toLowerCase().includes(lowerQuery)
                );
            } else {
                // البحث في حقول محددة
                return fields.some(field => 
                    String(item[field] || '').toLowerCase().includes(lowerQuery)
                );
            }
        });
    }
    
    // تصفية البيانات
    filter(filterFn) {
        return this.data.filter(filterFn);
    }
    
    // ترتيب البيانات
    sort(field, direction = 'asc') {
        return [...this.data].sort((a, b) => {
            const aVal = a[field];
            const bVal = b[field];
            
            if (direction === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });
    }
    
    // إنشاء معرف فريد
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    // تصدير البيانات
    export(format = 'json') {
        switch (format) {
            case 'pdf':
                ExportUtils.exportToPDF(this.data, this.itemName, `${this.itemName}.pdf`);
                break;
            case 'excel':
                ExportUtils.exportToExcel(this.data, this.itemName, `${this.itemName}.xlsx`);
                break;
            case 'json':
            default:
                const dataStr = JSON.stringify(this.data, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${this.itemName}.json`;
                link.click();
                URL.revokeObjectURL(url);
                break;
        }
    }
    
    // استيراد البيانات
    import(file, callback) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                if (Array.isArray(importedData)) {
                    this.data = importedData;
                    this.saveData();
                    if (callback) callback(true, 'تم استيراد البيانات بنجاح');
                } else {
                    if (callback) callback(false, 'تنسيق الملف غير صحيح');
                }
            } catch (error) {
                if (callback) callback(false, 'خطأ في قراءة الملف');
            }
        };
        reader.readAsText(file);
    }
}

// فئة لإدارة الصلاحيات
class PermissionManager {
    static checkPermission(userRole, requiredPermission) {
        const permissions = {
            'admin': ['buildings', 'residents', 'parking', 'violations', 'visitors', 'reports', 'users'],
            'violations': ['violations', 'reports'],
            'visitors': ['visitors', 'reports'],
            'readonly': ['reports']
        };
        
        return permissions[userRole]?.includes(requiredPermission) || false;
    }
    
    static hasAdminAccess(userRole) {
        return userRole === 'admin';
    }
    
    static canEdit(userRole, section) {
        if (userRole === 'admin') return true;
        
        const editPermissions = {
            'violations': ['violations'],
            'visitors': ['visitors']
        };
        
        return editPermissions[userRole]?.includes(section) || false;
    }
}

// تصدير الفئات للاستخدام العام
window.ExportUtils = ExportUtils;
window.CRUDManager = CRUDManager;
window.PermissionManager = PermissionManager;

