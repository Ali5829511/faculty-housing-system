// نظام ربط شامل بين جميع أقسام النظام
// System Integration for Faculty Housing Management

class SystemIntegration {
    constructor() {
        this.data = {
            buildings: [],
            apartments: [],
            residents: [],
            parking: [],
            stickers: [],
            complaints: [],
            violations: [],
            visitors: []
        };
        this.relationships = new Map();
        this.init();
    }

    async init() {
        await this.loadAllData();
        this.establishRelationships();
        this.setupEventListeners();
    }

    // تحميل جميع البيانات من الملفات
    async loadAllData() {
        try {
            // تحميل بيانات المباني
            const buildingsResponse = await fetch('buildings_data.json');
            if (buildingsResponse.ok) {
                this.data.buildings = await buildingsResponse.json();
            }

            // تحميل بيانات الشقق
            const apartmentsResponse = await fetch('apartments_data.json');
            if (apartmentsResponse.ok) {
                this.data.apartments = await apartmentsResponse.json();
            }

            // تحميل بيانات السكان
            const residentsResponse = await fetch('residents_data.json');
            if (residentsResponse.ok) {
                this.data.residents = await residentsResponse.json();
            }

            // تحميل بيانات المواقف
            const parkingResponse = await fetch('parking_data.json');
            if (parkingResponse.ok) {
                this.data.parking = await parkingResponse.json();
            }

            // تحميل بيانات الملصقات
            const stickersResponse = await fetch('stickers_data.json');
            if (stickersResponse.ok) {
                this.data.stickers = await stickersResponse.json();
            }

            // تحميل بيانات المخالفات
            const violationsResponse = await fetch('violations_data.json');
            if (violationsResponse.ok) {
                this.data.violations = await violationsResponse.json();
            }

            // تحميل بيانات السيارات المكبوحة
            const immobilizedCarsResponse = await fetch('immobilized_cars_data.json');
            if (immobilizedCarsResponse.ok) {
                this.data.immobilizedCars = await immobilizedCarsResponse.json();
            }

            console.log('تم تحميل جميع البيانات بنجاح');
        } catch (error) {
            console.error('خطأ في تحميل البيانات:', error);
        }
    }

    // إنشاء العلاقات بين البيانات
    establishRelationships() {
        // ربط السكان بالشقق
        this.data.residents.forEach(resident => {
            const apartment = this.findApartmentByUnit(resident.unit);
            if (apartment) {
                this.relationships.set(`resident_${resident.id}`, {
                    type: 'resident_apartment',
                    resident: resident,
                    apartment: apartment
                });
            }
        });

        // ربط المواقف بالشقق والسكان
        this.data.parking.forEach(parking => {
            const apartment = this.findApartmentByBuilding(parking.building, parking.apartment);
            const resident = this.findResidentByUnit(parking.building, parking.apartment);
            
            this.relationships.set(`parking_${parking.id}`, {
                type: 'parking_apartment_resident',
                parking: parking,
                apartment: apartment,
                resident: resident
            });
        });

        // ربط الملصقات بالسكان والمواقف
        this.data.stickers.forEach(sticker => {
            const resident = this.findResidentByName(sticker.owner_name);
            const parking = this.findParkingByResident(resident);
            
            this.relationships.set(`sticker_${sticker.id}`, {
                type: 'sticker_resident_parking',
                sticker: sticker,
                resident: resident,
                parking: parking
            });
        });

        // ربط المخالفات بالسكان والسيارات
        if (this.data.violations) {
            this.data.violations.forEach(violation => {
                const resident = this.findResidentByUnit(violation.resident_unit);
                const sticker = this.findStickerByPlate(violation.car_plate);
                
                this.relationships.set(`violation_${violation.id}`, {
                    type: 'violation_resident_sticker',
                    violation: violation,
                    resident: resident,
                    sticker: sticker
                });
            });
        }

        // ربط السيارات المكبوحة بالسكان والمخالفات
        if (this.data.immobilizedCars) {
            this.data.immobilizedCars.forEach(car => {
                const resident = this.findResidentByUnit(car.unit);
                const violation = this.findViolationByPlate(car.car_plate);
                const sticker = this.findStickerByPlate(car.car_plate);
                
                this.relationships.set(`immobilized_car_${car.id}`, {
                    type: 'immobilized_car_resident_violation',
                    immobilizedCar: car,
                    resident: resident,
                    violation: violation,
                    sticker: sticker
                });
            });
        }

        console.log('تم إنشاء العلاقات بين البيانات:', this.relationships);
    }

    // البحث عن شقة بالوحدة
    findApartmentByUnit(unit) {
        return this.data.apartments.find(apt => 
            apt.unit === unit || apt.apartment_number === unit
        );
    }

    // البحث عن شقة بالمبنى ورقم الشقة
    findApartmentByBuilding(building, apartmentNumber) {
        return this.data.apartments.find(apt => 
            apt.building === building && apt.apartment_number === apartmentNumber
        );
    }

    // البحث عن ساكن بالوحدة
    findResidentByUnit(building, apartment) {
        return this.data.residents.find(resident => {
            const unit = resident.unit || `${building}-${apartment}`;
            return unit.includes(building) && unit.includes(apartment);
        });
    }

    // البحث عن ساكن بالاسم
    findResidentByName(name) {
        return this.data.residents.find(resident => 
            resident.name === name || resident.resident_name === name
        );
    }

    // البحث عن موقف بالساكن
    findParkingByResident(resident) {
        if (!resident) return null;
        return this.data.parking.find(parking => 
            parking.resident_name === resident.name ||
            parking.resident_name === resident.resident_name
        );
    }

    // البحث عن ملصق بلوحة السيارة
    findStickerByPlate(carPlate) {
        if (!this.data.stickers || !carPlate) return null;
        return this.data.stickers.find(sticker => 
            sticker.car_plate === carPlate
        );
    }

    // البحث عن مخالفة بلوحة السيارة
    findViolationByPlate(carPlate) {
        if (!this.data.violations || !carPlate) return null;
        return this.data.violations.find(violation => 
            violation.car_plate === carPlate
        );
    }

    // الحصول على بيانات مترابطة لساكن معين
    getResidentCompleteData(residentId) {
        const resident = this.data.residents.find(r => r.id === residentId);
        if (!resident) return null;

        const apartment = this.findApartmentByUnit(resident.unit);
        const parking = this.findParkingByResident(resident);
        const stickers = this.data.stickers.filter(s => 
            s.owner_name === resident.name || s.owner_name === resident.resident_name
        );

        return {
            resident,
            apartment,
            parking,
            stickers,
            building: apartment ? this.data.buildings.find(b => b.name === apartment.building) : null
        };
    }

    // الحصول على بيانات مترابطة لمبنى معين
    getBuildingCompleteData(buildingId) {
        const building = this.data.buildings.find(b => b.id === buildingId);
        if (!building) return null;

        const apartments = this.data.apartments.filter(a => a.building === building.name);
        const residents = this.data.residents.filter(r => {
            const apartment = this.findApartmentByUnit(r.unit);
            return apartment && apartment.building === building.name;
        });
        const parking = this.data.parking.filter(p => p.building === building.name);

        return {
            building,
            apartments,
            residents,
            parking,
            occupancyRate: apartments.length > 0 ? (residents.length / apartments.length) * 100 : 0
        };
    }

    // الحصول على إحصائيات شاملة
    getSystemStatistics() {
        const totalBuildings = this.data.buildings.length;
        const totalApartments = this.data.apartments.length;
        const totalResidents = this.data.residents.length;
        const totalParking = this.data.parking.length;
        const totalStickers = this.data.stickers.length;

        const occupiedApartments = this.data.residents.length;
        const occupancyRate = totalApartments > 0 ? (occupiedApartments / totalApartments) * 100 : 0;

        const occupiedParking = this.data.parking.filter(p => p.status === 'مشغول' || p.resident_name).length;
        const parkingOccupancyRate = totalParking > 0 ? (occupiedParking / totalParking) * 100 : 0;

        return {
            totalBuildings,
            totalApartments,
            totalResidents,
            totalParking,
            totalStickers,
            occupancyRate: Math.round(occupancyRate),
            parkingOccupancyRate: Math.round(parkingOccupancyRate),
            availableApartments: totalApartments - occupiedApartments,
            availableParking: totalParking - occupiedParking
        };
    }

    // البحث المتقدم عبر جميع الأقسام
    globalSearch(query) {
        const results = {
            residents: [],
            apartments: [],
            parking: [],
            stickers: [],
            buildings: []
        };

        const searchTerm = query.toLowerCase();

        // البحث في السكان
        results.residents = this.data.residents.filter(r => 
            (r.name && r.name.toLowerCase().includes(searchTerm)) ||
            (r.resident_name && r.resident_name.toLowerCase().includes(searchTerm)) ||
            (r.phone && r.phone.includes(searchTerm)) ||
            (r.id_number && r.id_number.includes(searchTerm))
        );

        // البحث في الشقق
        results.apartments = this.data.apartments.filter(a => 
            (a.apartment_number && a.apartment_number.toString().includes(searchTerm)) ||
            (a.building && a.building.toLowerCase().includes(searchTerm))
        );

        // البحث في المواقف
        results.parking = this.data.parking.filter(p => 
            (p.parking_number && p.parking_number.toLowerCase().includes(searchTerm)) ||
            (p.building && p.building.toLowerCase().includes(searchTerm)) ||
            (p.resident_name && p.resident_name.toLowerCase().includes(searchTerm))
        );

        // البحث في الملصقات
        results.stickers = this.data.stickers.filter(s => 
            (s.sticker_number && s.sticker_number.toLowerCase().includes(searchTerm)) ||
            (s.owner_name && s.owner_name.toLowerCase().includes(searchTerm)) ||
            (s.car_plate && s.car_plate.toLowerCase().includes(searchTerm))
        );

        // البحث في المباني
        results.buildings = this.data.buildings.filter(b => 
            (b.name && b.name.toLowerCase().includes(searchTerm)) ||
            (b.location && b.location.toLowerCase().includes(searchTerm))
        );

        return results;
    }

    // تحديث البيانات عبر الأقسام
    updateRelatedData(type, id, newData) {
        switch (type) {
            case 'resident':
                this.updateResidentRelatedData(id, newData);
                break;
            case 'apartment':
                this.updateApartmentRelatedData(id, newData);
                break;
            case 'parking':
                this.updateParkingRelatedData(id, newData);
                break;
            case 'sticker':
                this.updateStickerRelatedData(id, newData);
                break;
        }
        this.establishRelationships(); // إعادة إنشاء العلاقات
    }

    // تحديث بيانات الساكن والبيانات المرتبطة
    updateResidentRelatedData(residentId, newData) {
        const residentIndex = this.data.residents.findIndex(r => r.id === residentId);
        if (residentIndex !== -1) {
            this.data.residents[residentIndex] = { ...this.data.residents[residentIndex], ...newData };
            
            // تحديث البيانات المرتبطة
            const resident = this.data.residents[residentIndex];
            
            // تحديث الموقف المرتبط
            const parkingIndex = this.data.parking.findIndex(p => p.resident_name === resident.name);
            if (parkingIndex !== -1) {
                this.data.parking[parkingIndex].resident_name = resident.name;
            }
            
            // تحديث الملصقات المرتبطة
            this.data.stickers.forEach((sticker, index) => {
                if (sticker.owner_name === resident.name) {
                    this.data.stickers[index].owner_name = resident.name;
                }
            });
        }
    }

    // إعداد مستمعي الأحداث للتحديث التلقائي
    setupEventListeners() {
        // مستمع لتحديث البيانات عند تغيير الصفحة
        window.addEventListener('beforeunload', () => {
            this.saveDataToLocalStorage();
        });

        // مستمع لتحديث البيانات عند التركيز على النافذة
        window.addEventListener('focus', () => {
            this.loadAllData();
        });
    }

    // حفظ البيانات في التخزين المحلي
    saveDataToLocalStorage() {
        localStorage.setItem('systemData', JSON.stringify(this.data));
        localStorage.setItem('systemRelationships', JSON.stringify(Array.from(this.relationships.entries())));
    }

    // تحميل البيانات من التخزين المحلي
    loadDataFromLocalStorage() {
        const savedData = localStorage.getItem('systemData');
        const savedRelationships = localStorage.getItem('systemRelationships');
        
        if (savedData) {
            this.data = JSON.parse(savedData);
        }
        
        if (savedRelationships) {
            this.relationships = new Map(JSON.parse(savedRelationships));
        }
    }

    // تصدير البيانات المترابطة
    exportIntegratedData() {
        const integratedData = {
            statistics: this.getSystemStatistics(),
            relationships: Array.from(this.relationships.entries()),
            completeData: {
                buildings: this.data.buildings.map(b => this.getBuildingCompleteData(b.id)),
                residents: this.data.residents.map(r => this.getResidentCompleteData(r.id))
            }
        };
        
        return integratedData;
    }
}

// إنشاء مثيل عام للنظام
window.systemIntegration = new SystemIntegration();

// دوال مساعدة عامة
window.getResidentData = (id) => window.systemIntegration.getResidentCompleteData(id);
window.getBuildingData = (id) => window.systemIntegration.getBuildingCompleteData(id);
window.getSystemStats = () => window.systemIntegration.getSystemStatistics();
window.searchGlobal = (query) => window.systemIntegration.globalSearch(query);
window.updateRelated = (type, id, data) => window.systemIntegration.updateRelatedData(type, id, data);

console.log('تم تحميل نظام الربط الشامل بنجاح');

