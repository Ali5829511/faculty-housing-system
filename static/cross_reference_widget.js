// ودجت المراجع المتقاطعة بين الأقسام
// Cross Reference Widget for System Integration

class CrossReferenceWidget {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.currentData = null;
        this.currentType = null;
        this.init();
    }

    init() {
        this.createWidget();
        this.setupEventListeners();
    }

    createWidget() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="cross-reference-widget">
                <div class="widget-header">
                    <h3><i class="fas fa-link"></i> المراجع المتقاطعة</h3>
                    <button class="widget-toggle" onclick="this.parentElement.parentElement.classList.toggle('collapsed')">
                        <i class="fas fa-chevron-up"></i>
                    </button>
                </div>
                <div class="widget-content">
                    <div class="search-section">
                        <input type="text" id="crossRefSearch" placeholder="البحث في جميع الأقسام..." class="search-input">
                        <button onclick="crossRefWidget.performGlobalSearch()" class="search-btn">
                            <i class="fas fa-search"></i>
                        </button>
                    </div>
                    <div class="reference-tabs">
                        <button class="tab-btn active" data-tab="related">البيانات المرتبطة</button>
                        <button class="tab-btn" data-tab="search">نتائج البحث</button>
                        <button class="tab-btn" data-tab="stats">الإحصائيات</button>
                    </div>
                    <div class="tab-content">
                        <div id="related-tab" class="tab-panel active">
                            <div id="relatedData">اختر عنصر لعرض البيانات المرتبطة</div>
                        </div>
                        <div id="search-tab" class="tab-panel">
                            <div id="searchResults">أدخل كلمة البحث أعلاه</div>
                        </div>
                        <div id="stats-tab" class="tab-panel">
                            <div id="systemStats">جاري تحميل الإحصائيات...</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.loadSystemStats();
    }

    setupEventListeners() {
        // مستمعي أحداث التبويبات
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // مستمع البحث عند الضغط على Enter
        const searchInput = document.getElementById('crossRefSearch');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performGlobalSearch();
                }
            });
        }
    }

    switchTab(tabName) {
        // إزالة الفئة النشطة من جميع التبويبات
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));

        // إضافة الفئة النشطة للتبويب المحدد
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');
    }

    // عرض البيانات المرتبطة لعنصر معين
    showRelatedData(type, id, data) {
        this.currentType = type;
        this.currentData = data;

        const relatedContainer = document.getElementById('relatedData');
        if (!relatedContainer) return;

        let html = '';

        switch (type) {
            case 'resident':
                html = this.generateResidentRelatedData(data);
                break;
            case 'apartment':
                html = this.generateApartmentRelatedData(data);
                break;
            case 'parking':
                html = this.generateParkingRelatedData(data);
                break;
            case 'building':
                html = this.generateBuildingRelatedData(data);
                break;
            case 'sticker':
                html = this.generateStickerRelatedData(data);
                break;
            default:
                html = '<p>نوع البيانات غير مدعوم</p>';
        }

        relatedContainer.innerHTML = html;
        this.switchTab('related');
    }

    generateResidentRelatedData(resident) {
        const completeData = window.getResidentData ? window.getResidentData(resident.id) : null;
        
        let html = `
            <div class="related-data-section">
                <h4><i class="fas fa-user"></i> بيانات الساكن</h4>
                <div class="data-card">
                    <p><strong>الاسم:</strong> ${resident.name || resident.resident_name || 'غير محدد'}</p>
                    <p><strong>الوحدة:</strong> ${resident.unit || 'غير محدد'}</p>
                    <p><strong>الجوال:</strong> ${resident.phone || 'غير محدد'}</p>
                </div>
            </div>
        `;

        if (completeData) {
            if (completeData.apartment) {
                html += `
                    <div class="related-data-section">
                        <h4><i class="fas fa-home"></i> الشقة المرتبطة</h4>
                        <div class="data-card clickable" onclick="crossRefWidget.showRelatedData('apartment', '${completeData.apartment.id}', ${JSON.stringify(completeData.apartment).replace(/"/g, '&quot;')})">
                            <p><strong>رقم الشقة:</strong> ${completeData.apartment.apartment_number}</p>
                            <p><strong>المبنى:</strong> ${completeData.apartment.building}</p>
                            <p><strong>الحالة:</strong> ${completeData.apartment.status || 'مشغولة'}</p>
                        </div>
                    </div>
                `;
            }

            if (completeData.parking) {
                html += `
                    <div class="related-data-section">
                        <h4><i class="fas fa-car"></i> الموقف المرتبط</h4>
                        <div class="data-card clickable" onclick="crossRefWidget.showRelatedData('parking', '${completeData.parking.id}', ${JSON.stringify(completeData.parking).replace(/"/g, '&quot;')})">
                            <p><strong>رقم الموقف:</strong> ${completeData.parking.parking_number}</p>
                            <p><strong>الحالة:</strong> ${completeData.parking.status || 'مشغول'}</p>
                        </div>
                    </div>
                `;
            }

            if (completeData.stickers && completeData.stickers.length > 0) {
                html += `
                    <div class="related-data-section">
                        <h4><i class="fas fa-id-card"></i> الملصقات المرتبطة</h4>
                `;
                completeData.stickers.forEach(sticker => {
                    html += `
                        <div class="data-card clickable" onclick="crossRefWidget.showRelatedData('sticker', '${sticker.id}', ${JSON.stringify(sticker).replace(/"/g, '&quot;')})">
                            <p><strong>رقم الملصق:</strong> ${sticker.sticker_number}</p>
                            <p><strong>لوحة السيارة:</strong> ${sticker.car_plate}</p>
                            <p><strong>الحالة:</strong> ${sticker.status || 'فعال'}</p>
                        </div>
                    `;
                });
                html += '</div>';
            }
        }

        return html;
    }

    generateApartmentRelatedData(apartment) {
        let html = `
            <div class="related-data-section">
                <h4><i class="fas fa-home"></i> بيانات الشقة</h4>
                <div class="data-card">
                    <p><strong>رقم الشقة:</strong> ${apartment.apartment_number}</p>
                    <p><strong>المبنى:</strong> ${apartment.building}</p>
                    <p><strong>الحالة:</strong> ${apartment.status || 'غير محدد'}</p>
                </div>
            </div>
        `;

        // البحث عن الساكن المرتبط
        if (window.systemIntegration) {
            const resident = window.systemIntegration.findResidentByUnit(`${apartment.building}-${apartment.apartment_number}`);
            if (resident) {
                html += `
                    <div class="related-data-section">
                        <h4><i class="fas fa-user"></i> الساكن المرتبط</h4>
                        <div class="data-card clickable" onclick="crossRefWidget.showRelatedData('resident', '${resident.id}', ${JSON.stringify(resident).replace(/"/g, '&quot;')})">
                            <p><strong>الاسم:</strong> ${resident.name || resident.resident_name}</p>
                            <p><strong>الجوال:</strong> ${resident.phone || 'غير محدد'}</p>
                        </div>
                    </div>
                `;
            }
        }

        return html;
    }

    generateParkingRelatedData(parking) {
        let html = `
            <div class="related-data-section">
                <h4><i class="fas fa-car"></i> بيانات الموقف</h4>
                <div class="data-card">
                    <p><strong>رقم الموقف:</strong> ${parking.parking_number}</p>
                    <p><strong>المبنى:</strong> ${parking.building}</p>
                    <p><strong>الحالة:</strong> ${parking.status || 'غير محدد'}</p>
                </div>
            </div>
        `;

        if (parking.resident_name) {
            html += `
                <div class="related-data-section">
                    <h4><i class="fas fa-user"></i> الساكن المرتبط</h4>
                    <div class="data-card">
                        <p><strong>الاسم:</strong> ${parking.resident_name}</p>
                    </div>
                </div>
            `;
        }

        return html;
    }

    generateBuildingRelatedData(building) {
        const completeData = window.getBuildingData ? window.getBuildingData(building.id) : null;
        
        let html = `
            <div class="related-data-section">
                <h4><i class="fas fa-building"></i> بيانات المبنى</h4>
                <div class="data-card">
                    <p><strong>اسم المبنى:</strong> ${building.name}</p>
                    <p><strong>الموقع:</strong> ${building.location || 'غير محدد'}</p>
                    <p><strong>النوع:</strong> ${building.type || 'غير محدد'}</p>
                </div>
            </div>
        `;

        if (completeData) {
            html += `
                <div class="related-data-section">
                    <h4><i class="fas fa-chart-bar"></i> إحصائيات المبنى</h4>
                    <div class="data-card">
                        <p><strong>عدد الشقق:</strong> ${completeData.apartments.length}</p>
                        <p><strong>عدد السكان:</strong> ${completeData.residents.length}</p>
                        <p><strong>معدل الإشغال:</strong> ${Math.round(completeData.occupancyRate)}%</p>
                    </div>
                </div>
            `;
        }

        return html;
    }

    generateStickerRelatedData(sticker) {
        let html = `
            <div class="related-data-section">
                <h4><i class="fas fa-id-card"></i> بيانات الملصق</h4>
                <div class="data-card">
                    <p><strong>رقم الملصق:</strong> ${sticker.sticker_number}</p>
                    <p><strong>اسم المالك:</strong> ${sticker.owner_name}</p>
                    <p><strong>لوحة السيارة:</strong> ${sticker.car_plate}</p>
                    <p><strong>الحالة:</strong> ${sticker.status || 'فعال'}</p>
                </div>
            </div>
        `;

        return html;
    }

    // البحث الشامل
    performGlobalSearch() {
        const searchInput = document.getElementById('crossRefSearch');
        const query = searchInput.value.trim();
        
        if (!query) {
            alert('يرجى إدخال كلمة البحث');
            return;
        }

        const results = window.searchGlobal ? window.searchGlobal(query) : null;
        this.displaySearchResults(results, query);
        this.switchTab('search');
    }

    displaySearchResults(results, query) {
        const searchContainer = document.getElementById('searchResults');
        if (!searchContainer) return;

        if (!results) {
            searchContainer.innerHTML = '<p>خطأ في البحث</p>';
            return;
        }

        let html = `<h4>نتائج البحث عن: "${query}"</h4>`;
        let totalResults = 0;

        // نتائج السكان
        if (results.residents && results.residents.length > 0) {
            html += `
                <div class="search-section">
                    <h5><i class="fas fa-users"></i> السكان (${results.residents.length})</h5>
            `;
            results.residents.forEach(resident => {
                html += `
                    <div class="search-result-item clickable" onclick="crossRefWidget.showRelatedData('resident', '${resident.id}', ${JSON.stringify(resident).replace(/"/g, '&quot;')})">
                        <strong>${resident.name || resident.resident_name}</strong>
                        <span>${resident.unit || 'غير محدد'}</span>
                    </div>
                `;
            });
            html += '</div>';
            totalResults += results.residents.length;
        }

        // نتائج الشقق
        if (results.apartments && results.apartments.length > 0) {
            html += `
                <div class="search-section">
                    <h5><i class="fas fa-home"></i> الشقق (${results.apartments.length})</h5>
            `;
            results.apartments.forEach(apartment => {
                html += `
                    <div class="search-result-item clickable" onclick="crossRefWidget.showRelatedData('apartment', '${apartment.id}', ${JSON.stringify(apartment).replace(/"/g, '&quot;')})">
                        <strong>شقة ${apartment.apartment_number}</strong>
                        <span>${apartment.building}</span>
                    </div>
                `;
            });
            html += '</div>';
            totalResults += results.apartments.length;
        }

        // نتائج المواقف
        if (results.parking && results.parking.length > 0) {
            html += `
                <div class="search-section">
                    <h5><i class="fas fa-car"></i> المواقف (${results.parking.length})</h5>
            `;
            results.parking.forEach(parking => {
                html += `
                    <div class="search-result-item clickable" onclick="crossRefWidget.showRelatedData('parking', '${parking.id}', ${JSON.stringify(parking).replace(/"/g, '&quot;')})">
                        <strong>موقف ${parking.parking_number}</strong>
                        <span>${parking.building}</span>
                    </div>
                `;
            });
            html += '</div>';
            totalResults += results.parking.length;
        }

        // نتائج الملصقات
        if (results.stickers && results.stickers.length > 0) {
            html += `
                <div class="search-section">
                    <h5><i class="fas fa-id-card"></i> الملصقات (${results.stickers.length})</h5>
            `;
            results.stickers.forEach(sticker => {
                html += `
                    <div class="search-result-item clickable" onclick="crossRefWidget.showRelatedData('sticker', '${sticker.id}', ${JSON.stringify(sticker).replace(/"/g, '&quot;')})">
                        <strong>${sticker.sticker_number}</strong>
                        <span>${sticker.owner_name}</span>
                    </div>
                `;
            });
            html += '</div>';
            totalResults += results.stickers.length;
        }

        // نتائج المباني
        if (results.buildings && results.buildings.length > 0) {
            html += `
                <div class="search-section">
                    <h5><i class="fas fa-building"></i> المباني (${results.buildings.length})</h5>
            `;
            results.buildings.forEach(building => {
                html += `
                    <div class="search-result-item clickable" onclick="crossRefWidget.showRelatedData('building', '${building.id}', ${JSON.stringify(building).replace(/"/g, '&quot;')})">
                        <strong>${building.name}</strong>
                        <span>${building.location || 'غير محدد'}</span>
                    </div>
                `;
            });
            html += '</div>';
            totalResults += results.buildings.length;
        }

        if (totalResults === 0) {
            html += '<p>لم يتم العثور على نتائج</p>';
        }

        searchContainer.innerHTML = html;
    }

    // تحميل إحصائيات النظام
    loadSystemStats() {
        const statsContainer = document.getElementById('systemStats');
        if (!statsContainer) return;

        const stats = window.getSystemStats ? window.getSystemStats() : null;
        
        if (!stats) {
            statsContainer.innerHTML = '<p>خطأ في تحميل الإحصائيات</p>';
            return;
        }

        const html = `
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-number">${stats.totalBuildings}</div>
                    <div class="stat-label">إجمالي المباني</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${stats.totalApartments}</div>
                    <div class="stat-label">إجمالي الشقق</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${stats.totalResidents}</div>
                    <div class="stat-label">إجمالي السكان</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${stats.totalParking}</div>
                    <div class="stat-label">إجمالي المواقف</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${stats.occupancyRate}%</div>
                    <div class="stat-label">معدل إشغال الشقق</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${stats.parkingOccupancyRate}%</div>
                    <div class="stat-label">معدل إشغال المواقف</div>
                </div>
            </div>
        `;

        statsContainer.innerHTML = html;
    }
}

// إنشاء مثيل عام للودجت
window.crossRefWidget = null;

// دالة لتهيئة الودجت
function initCrossReferenceWidget(containerId = 'crossReferenceWidget') {
    window.crossRefWidget = new CrossReferenceWidget(containerId);
}

// تهيئة تلقائية عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // البحث عن حاوي الودجت
    const container = document.getElementById('crossReferenceWidget');
    if (container) {
        initCrossReferenceWidget();
    }
});

console.log('تم تحميل ودجت المراجع المتقاطعة بنجاح');

