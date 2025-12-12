// ملف JavaScript لربط جميع أقسام النظام مع بعضها البعض
// يحتوي على دوال مشتركة للتنقل بين الأقسام وتبادل البيانات

// بيانات النظام المشتركة
let systemData = {
    buildings: [],
    residents: [],
    parking: [],
    stickers: [],
    complaints: []
};

// تحميل جميع البيانات
async function loadAllSystemData() {
    try {
        // تحميل بيانات المباني
        try {
            const buildingsResponse = await fetch('buildings_data.json');
            if (buildingsResponse.ok) {
                systemData.buildings = await buildingsResponse.json();
            }
        } catch (e) {
            console.log('لم يتم العثور على بيانات المباني');
        }

        // تحميل بيانات السكان
        try {
            const residentsResponse = await fetch('residents_data.json');
            if (residentsResponse.ok) {
                systemData.residents = await residentsResponse.json();
            }
        } catch (e) {
            console.log('لم يتم العثور على بيانات السكان');
        }

        // تحميل بيانات المواقف
        try {
            const parkingResponse = await fetch('parking_data.json');
            if (parkingResponse.ok) {
                systemData.parking = await parkingResponse.json();
            }
        } catch (e) {
            console.log('لم يتم العثور على بيانات المواقف');
        }

        // تحميل بيانات الملصقات
        try {
            const stickersResponse = await fetch('stickers_data.json');
            if (stickersResponse.ok) {
                systemData.stickers = await stickersResponse.json();
            }
        } catch (e) {
            console.log('لم يتم العثور على بيانات الملصقات');
        }

        console.log('تم تحميل بيانات النظام:', {
            buildings: systemData.buildings.length,
            residents: systemData.residents.length,
            parking: systemData.parking.length,
            stickers: systemData.stickers.length
        });

        return systemData;
    } catch (error) {
        console.error('خطأ في تحميل بيانات النظام:', error);
        return systemData;
    }
}

// حساب الإحصائيات الشاملة للنظام
function calculateSystemStatistics() {
    const stats = {
        // إحصائيات المباني
        totalBuildings: systemData.buildings.length,
        oldBuildings: systemData.buildings.filter(b => b.الموقع === 'المباني القديمة').length,
        newBuildings: systemData.buildings.filter(b => b.الموقع === 'المباني الجديدة').length,
        villas: systemData.buildings.filter(b => b.الوصف === 'فلة').length,
        
        // إحصائيات السكان
        totalResidents: systemData.residents.length,
        villaResidents: systemData.residents.filter(r => r['نوع الوحدة'] === 'فلة').length,
        apartmentResidents: systemData.residents.filter(r => r['نوع الوحدة'] === 'شقة').length,
        
        // إحصائيات المواقف
        totalParking: systemData.parking.length,
        occupiedParking: systemData.parking.filter(p => p.الحالة === 'مشغول').length,
        availableParking: systemData.parking.filter(p => p.الحالة === 'متاح').length,
        
        // إحصائيات الملصقات
        totalStickers: systemData.stickers.length,
        activeStickers: systemData.stickers.filter(s => s.الحالة === 'فعال').length,
        expiredStickers: systemData.stickers.filter(s => s.الحالة === 'منتهي الصلاحية').length
    };

    // حساب معدلات الإشغال
    stats.occupancyRate = stats.totalResidents > 0 ? 
        Math.round((stats.totalResidents / (stats.totalBuildings * 20)) * 100) : 0;
    
    stats.parkingOccupancyRate = stats.totalParking > 0 ? 
        Math.round((stats.occupiedParking / stats.totalParking) * 100) : 0;

    return stats;
}

// ربط البيانات بين الأقسام
function linkSystemData() {
    // ربط السكان بالمباني
    systemData.residents.forEach(resident => {
        const building = systemData.buildings.find(b => 
            b.الاسم === resident.المبنى || 
            b.الاسم === resident.الوحدة
        );
        if (building) {
            resident.buildingData = building;
        }
    });

    // ربط المواقف بالمباني والسكان
    systemData.parking.forEach(parking => {
        const building = systemData.buildings.find(b => 
            b.الاسم === parking.المبنى
        );
        if (building) {
            parking.buildingData = building;
        }

        const resident = systemData.residents.find(r => 
            r.الوحدة === parking.الشقة || 
            r.المبنى === parking.المبنى
        );
        if (resident) {
            parking.residentData = resident;
        }
    });

    // ربط الملصقات بالسكان والمواقف
    systemData.stickers.forEach(sticker => {
        const resident = systemData.residents.find(r => 
            r['رقم الهوية'] === sticker['رقم الهوية'] ||
            r.الاسم === sticker.الاسم
        );
        if (resident) {
            sticker.residentData = resident;
        }

        const parking = systemData.parking.find(p => 
            p.الشقة === sticker.الوحدة ||
            p.المبنى === sticker.المبنى
        );
        if (parking) {
            sticker.parkingData = parking;
        }
    });

    console.log('تم ربط البيانات بين الأقسام بنجاح');
}

// البحث الشامل في جميع البيانات
function globalSearch(searchTerm) {
    const results = {
        buildings: [],
        residents: [],
        parking: [],
        stickers: []
    };

    const term = searchTerm.toLowerCase();

    // البحث في المباني
    results.buildings = systemData.buildings.filter(building => 
        (building.الاسم || '').toLowerCase().includes(term) ||
        (building.الموقع || '').toLowerCase().includes(term) ||
        (building.الوصف || '').toLowerCase().includes(term)
    );

    // البحث في السكان
    results.residents = systemData.residents.filter(resident => 
        (resident.الاسم || '').toLowerCase().includes(term) ||
        (resident['رقم الهوية'] || '').includes(term) ||
        (resident.الجوال || '').includes(term) ||
        (resident.الوحدة || '').toLowerCase().includes(term)
    );

    // البحث في المواقف
    results.parking = systemData.parking.filter(parking => 
        (parking['رقم الموقف'] || '').toLowerCase().includes(term) ||
        (parking.المبنى || '').toLowerCase().includes(term) ||
        (parking.الشقة || '').toLowerCase().includes(term)
    );

    // البحث في الملصقات
    results.stickers = systemData.stickers.filter(sticker => 
        (sticker.الاسم || '').toLowerCase().includes(term) ||
        (sticker['رقم الهوية'] || '').includes(term) ||
        (sticker['رقم اللوحة'] || '').toLowerCase().includes(term) ||
        (sticker.الوحدة || '').toLowerCase().includes(term)
    );

    return results;
}

// التنقل بين الأقسام مع تمرير البيانات
function navigateToSection(sectionName, data = null) {
    const sectionUrls = {
        'buildings': 'buildings_management_updated.html',
        'residents': 'residents_management_updated.html',
        'parking': 'parking_management_linked.html',
        'stickers': 'نظامإدارةملصقاتسياراتإسكانأعضاءهيئةالتدريس.html',
        'complaints': 'complaints_management.html',
        'dashboard': 'dashboard.html'
    };

    const url = sectionUrls[sectionName];
    if (url) {
        if (data) {
            // حفظ البيانات في localStorage للتمرير بين الصفحات
            localStorage.setItem('navigationData', JSON.stringify(data));
        }
        window.location.href = url;
    }
}

// استرجاع البيانات المرسلة من صفحة أخرى
function getNavigationData() {
    const data = localStorage.getItem('navigationData');
    if (data) {
        localStorage.removeItem('navigationData');
        return JSON.parse(data);
    }
    return null;
}

// تصدير البيانات إلى Excel
function exportToExcel(data, filename) {
    if (!data || data.length === 0) {
        alert('لا توجد بيانات للتصدير');
        return;
    }

    // تحويل البيانات إلى CSV
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');

    // تحميل الملف
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

// إنشاء تقرير شامل
function generateComprehensiveReport() {
    const stats = calculateSystemStatistics();
    
    const report = {
        تاريخ_التقرير: new Date().toLocaleDateString('ar-SA'),
        إجمالي_المباني: stats.totalBuildings,
        المباني_القديمة: stats.oldBuildings,
        المباني_الجديدة: stats.newBuildings,
        الفلل: stats.villas,
        إجمالي_السكان: stats.totalResidents,
        سكان_الفلل: stats.villaResidents,
        سكان_الشقق: stats.apartmentResidents,
        معدل_الإشغال: `${stats.occupancyRate}%`,
        إجمالي_المواقف: stats.totalParking,
        المواقف_المشغولة: stats.occupiedParking,
        المواقف_المتاحة: stats.availableParking,
        معدل_إشغال_المواقف: `${stats.parkingOccupancyRate}%`,
        إجمالي_الملصقات: stats.totalStickers,
        الملصقات_الفعالة: stats.activeStickers,
        الملصقات_المنتهية: stats.expiredStickers
    };

    return report;
}

// تهيئة النظام عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', async function() {
    await loadAllSystemData();
    linkSystemData();
    
    // إضافة مستمعي الأحداث للتنقل السريع
    const quickNavButtons = document.querySelectorAll('[data-navigate]');
    quickNavButtons.forEach(button => {
        button.addEventListener('click', function() {
            const section = this.getAttribute('data-navigate');
            navigateToSection(section);
        });
    });
});

// تصدير الدوال للاستخدام العام
window.systemData = systemData;
window.loadAllSystemData = loadAllSystemData;
window.calculateSystemStatistics = calculateSystemStatistics;
window.linkSystemData = linkSystemData;
window.globalSearch = globalSearch;
window.navigateToSection = navigateToSection;
window.getNavigationData = getNavigationData;
window.exportToExcel = exportToExcel;
window.generateComprehensiveReport = generateComprehensiveReport;

