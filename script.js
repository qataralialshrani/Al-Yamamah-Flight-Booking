// العناصر الرئيسية
const steps = document.querySelectorAll('.step');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');
const bookingForm = document.getElementById('bookingForm'); 
const passengersSelect = document.getElementById('passengers');
const tripTypeSelect = document.getElementById('tripType');
const returnDateGroup = document.getElementById('returnDateGroup');

// متغيرات التذكرة
let selectedTicketType = '';
let selectedTicketPrice = 0;
let totalAmount = 0;

// إظهار/إخفاء تاريخ العودة بناءً على نوع الرحلة
tripTypeSelect.addEventListener('change', function() {
    if (this.value === 'ذهاب وعودة') {
        returnDateGroup.style.display = 'block';
        document.getElementById('returnDate').required = true;
    } else {
        returnDateGroup.style.display = 'none';
        document.getElementById('returnDate').required = false;
    }
});

// إرسال بيانات الحجز إلى Formspree بعد التحقق
bookingForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // التحقق من جميع الحقول المطلوبة
    if (!validateForm()) {
        showError('يرجى ملء جميع الحقول المطلوبة بشكل صحيح');
        return;
    }
    
    // التحقق من اختيار التذكرة
    if (!selectedTicketType) {
        showError('يرجى اختيار نوع التذكرة أولاً');
        showStep(2);
        return;
    }
    
    // توليد رقم الحجز وإضافته للبيانات المرسلة
    const ref = generateBookingReference();
    document.getElementById('bookingReference').textContent = ref;
    
    // إضافة حقول مخفية لـ Formspree
    addHiddenField('Ticket_Type', selectedTicketType);
    addHiddenField('Ticket_Price', selectedTicketPrice.toString());
    addHiddenField('Total_Amount', totalAmount.toString());
    addHiddenField('Booking_Reference', ref);

    // إظهار رسالة تحميل
    showLoading();

    try {
        // إرسال البيانات إلى Formspree
        const formData = new FormData(bookingForm);
        
        const response = await fetch(bookingForm.action, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            // إنشاء التذكرة الإلكترونية
            generateETicket(ref);
            
            // الانتقال إلى صفحة التأكيد
            setTimeout(() => {
                hideLoading();
                showStep(6);
                
                // حفظ البيانات في قاعدة البيانات (محاكاة)
                saveToDatabase(formData, ref, totalAmount);
                
                showSuccess('تم إرسال بيانات الحجز بنجاح! سيصلك تأكيد على بريدك الإلكتروني.');
            }, 2000);
        } else {
            throw new Error('فشل في إرسال البيانات');
        }
    } catch (error) {
        hideLoading();
        showError('حدث خطأ في إرسال البيانات. يرجى المحاولة مرة أخرى.');
        console.error('Error:', error);
    }
});

// إضافة حقل مخفي للنموذج
function addHiddenField(name, value) {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    bookingForm.appendChild(input);
}

// اختيار التذكرة
function setupTicketSelection() {
    document.querySelectorAll('.select-ticket').forEach(button => {
        button.addEventListener('click', function() {
            const ticketOption = this.closest('.ticket-option');
            const ticketType = ticketOption.dataset.type;
            const ticketPrice = parseFloat(ticketOption.dataset.price);
            
            // إزالة التحديد من جميع التذاكر
            document.querySelectorAll('.ticket-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            
            // تحديد التذكرة المختارة
            ticketOption.classList.add('selected');
            
            // حفظ البيانات
            selectedTicketType = ticketType;
            selectedTicketPrice = ticketPrice;
            
            // تحديث السعر الإجمالي
            updateTotalPrice();
            
            // عرض ملخص التذكرة
            showTicketSummary();
            
            showSuccess('تم اختيار التذكرة بنجاح!');
        });
    });
}

// تحديث السعر الإجمالي
function updateTotalPrice() {
    const passengerCount = parseInt(passengersSelect.value);
    totalAmount = selectedTicketPrice * passengerCount;
    
    // تحديث عرض السعر
    if (document.getElementById('totalPrice')) {
        document.getElementById('totalPrice').textContent = `السعر الإجمالي: ${totalAmount} ر.س`;
    }
    if (document.getElementById('finalPrice')) {
        document.getElementById('finalPrice').textContent = `المبلغ الإجمالي: ${totalAmount} ر.س`;
    }
    if (document.getElementById('paymentAmount')) {
        document.getElementById('paymentAmount').textContent = `${totalAmount} ر.س`;
    }
    
    // تحديث QR Code
    updateQRCode();
    
    // تحديث ملخص الطلب
    updateOrderSummary();
}

// تحديث ملخص الطلب
function updateOrderSummary() {
    const departure = document.getElementById('departure').value;
    const destination = document.getElementById('destination').value;
    const departureDate = document.getElementById('departureDate').value;
    const returnDate = document.getElementById('returnDate').value;
    const passengerCount = passengersSelect.value;
    const tripType = document.getElementById('tripType').value;
    const airline = document.getElementById('airline').value;
    
    if (!document.getElementById('orderSummary')) return;
    
    let summaryHTML = `
        <p><strong>نوع الرحلة:</strong> ${tripType}</p>
        <p><strong>من:</strong> ${departure}</p>
        <p><strong>إلى:</strong> ${destination}</p>
        <p><strong>تاريخ المغادرة:</strong> ${departureDate}</p>
    `;
    
    if (returnDate) {
        summaryHTML += `<p><strong>تاريخ العودة:</strong> ${returnDate}</p>`;
    }
    
    summaryHTML += `
        <p><strong>عدد المسافرين:</strong> ${passengerCount}</p>
        <p><strong>شركة الطيران:</strong> ${airline}</p>
        <p><strong>نوع التذكرة:</strong> ${getTicketName(selectedTicketType)}</p>
        <p><strong>سعر التذكرة:</strong> ${selectedTicketPrice} ر.س</p>
    `;
    
    document.getElementById('orderSummary').innerHTML = summaryHTML;
}

// عرض ملخص التذكرة
function showTicketSummary() {
    if (!document.getElementById('ticketSummary')) return;
    
    const summary = `
        <p><strong>نوع التذكرة:</strong> ${getTicketName(selectedTicketType)}</p>
        <p><strong>سعر التذكرة:</strong> ${selectedTicketPrice} ر.س</p>
        <p><strong>عدد المسافرين:</strong> ${passengersSelect.value}</p>
    `;
    
    document.getElementById('ticketSummary').innerHTML = summary;
    document.getElementById('selectedTicketInfo').style.display = 'block';
}

// تحديث QR Code
function updateQRCode() {
    const qrContainer = document.getElementById('qrcode');
    if (!qrContainer) return;
    
    qrContainer.innerHTML = '';
    
    if (totalAmount > 0) {
        const qrData = JSON.stringify({
            bank: 'alanma',
            account: 'SA6305000068206733958000',
            amount: totalAmount,
            beneficiary: 'اليمامة للطيران',
            reference: `YM-${Date.now()}`
        });
        
        new QRCode(qrContainer, {
            text: qrData,
            width: 200,
            height: 200,
            colorDark: "#0b5563",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    }
}

// إنشاء التذكرة الإلكترونية
function generateETicket(reference) {
    const departure = document.getElementById('departure').value;
    const destination = document.getElementById('destination').value;
    const departureDate = document.getElementById('departureDate').value;
    const returnDate = document.getElementById('returnDate').value;
    const passengerCount = passengersSelect.value;
    const tripType = document.getElementById('tripType').value;
    const airline = document.getElementById('airline').value;
    
    if (!document.getElementById('eTicketDetails')) return;
    
    let ticketDetails = `
        <div class="ticket-info">
            <p><strong>رقم الحجز:</strong> ${reference}</p>
            <p><strong>نوع الرحلة:</strong> ${tripType}</p>
            <p><strong>من:</strong> ${departure}</p>
            <p><strong>إلى:</strong> ${destination}</p>
            <p><strong>تاريخ المغادرة:</strong> ${departureDate}</p>
    `;
    
    if (returnDate) {
        ticketDetails += `<p><strong>تاريخ العودة:</strong> ${returnDate}</p>`;
    }
    
    ticketDetails += `
            <p><strong>عدد المسافرين:</strong> ${passengerCount}</p>
            <p><strong>شركة الطيران:</strong> ${airline}</p>
            <p><strong>نوع التذكرة:</strong> ${getTicketName(selectedTicketType)}</p>
            <p><strong>المبلغ المدفوع:</strong> ${totalAmount} ر.س</p>
            <hr style="border-color: white; margin: 15px 0;">
            <p><strong>تعليمات السفر:</strong></p>
            <p>• الحضور قبل ساعتين من الإقلاع</p>
            <p>• إحضار الهوية والجواز الأصلي</p>
            <p>• طباعة هذه التذكرة أو عرضها على الجوال</p>
        </div>
    `;
    
    document.getElementById('eTicketDetails').innerHTML = ticketDetails;
}

// الحصول على اسم التذكرة
function getTicketName(type) {
    const names = {
        'economy': 'الدرجة الاقتصادية',
        'premium_economy': 'الدرجة المميزة',
        'business': 'درجة رجال الأعمال'
    };
    return names[type] || type;
}

// توليد حقول المسافرين ديناميكياً
function generatePassengerForms() {
    const passengerCount = parseInt(passengersSelect.value);
    const container = document.getElementById('passengerForms');
    if (!container) return;
    
    container.innerHTML = '';
    
    for (let i = 1; i <= passengerCount; i++) {
        const passengerForm = document.createElement('div');
        passengerForm.className = 'passenger-form';
        passengerForm.innerHTML = `
            <h3>المسافر ${i}</h3>
            <div class="form-group">
                <label for="passengerName${i}">الاسم الكامل (كما في الجواز):</label>
                <input type="text" id="passengerName${i}" name="Passenger_${i}_Name" required>
            </div>
            <div class="form-group">
                <label for="passengerNationality${i}">الجنسية:</label>
                <select id="passengerNationality${i}" name="Passenger_${i}_Nationality" required>
                    <option value="">اختر الجنسية</option>
                    <option value="سعودي">سعودي</option>
                    <option value="مصري">مصري</option>
                    <option value="أردني">أردني</option>
                    <option value="سوري">سوري</option>
                    <option value="لبناني">لبناني</option>
                    <option value="إماراتي">إماراتي</option>
                    <option value="قطري">قطري</option>
                    <option value="كويتي">كويتي</option>
                    <option value="بحريني">بحريني</option>
                    <option value="عماني">عماني</option>
                    <option value="يمني">يمني</option>
                    <option value="هندي">هندي</option>
                    <option value="باكستاني">باكستاني</option>
                    <option value="فلبيني">فلبيني</option>
                    <option value="أخرى">أخرى</option>
                </select>
            </div>
            <div class="form-group">
                <label for="passengerDOB${i}">تاريخ الميلاد:</label>
                <input type="date" id="passengerDOB${i}" name="Passenger_${i}_DOB" required>
            </div>
            <div class="form-group">
                <label for="passengerGender${i}">الجنس:</label>
                <select id="passengerGender${i}" name="Passenger_${i}_Gender" required>
                    <option value="">اختر الجنس</option>
                    <option value="ذكر">ذكر</option>
                    <option value="أنثى">أنثى</option>
                </select>
            </div>
            <div class="form-group">
                <label for="passengerPassport${i}">رقم الجواز / الهوية:</label>
                <input type="text" id="passengerPassport${i}" name="Passenger_${i}_Passport" required>
            </div>
            <div class="document-upload">
                <h4>رفع المستندات المطلوبة</h4>
                <div class="form-group">
                    <label for="passportPhoto${i}">صورة الجواز (PDF, JPG, PNG):</label>
                    <input type="file" id="passportPhoto${i}" name="Passenger_${i}_Passport_Photo" accept=".pdf,.jpg,.jpeg,.png" required>
                </div>
                <div class="form-group">
                    <label for="idPhoto${i}">صورة الهوية الوطنية (PDF, JPG, PNG):</label>
                    <input type="file" id="idPhoto${i}" name="Passenger_${i}_ID_Photo" accept=".pdf,.jpg,.jpeg,.png" required>
                </div>
            </div>
            ${i < passengerCount ? '<hr style="margin: 15px 0;">' : ''}
        `;
        container.appendChild(passengerForm);
    }
    
    // تحديث أسعار التذاكر بعد تغيير عدد المسافرين
    if (selectedTicketType) {
        updateTotalPrice();
    }
}

// توليد رقم حجز عشوائي
function generateBookingReference() {
    const prefix = 'YM'; 
    const year = new Date().getFullYear();
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    return `${prefix}-${year}-${randomNum}`;
}

// التحقق من صحة النموذج
function validateForm() {
    // التحقق من الخطوة 1
    if (!document.getElementById('departure').value || 
        !document.getElementById('destination').value || 
        !document.getElementById('departureDate').value) {
        return false;
    }
    
    // التحقق من اختيار التذكرة
    if (!selectedTicketType) {
        return false;
    }
    
    // التحقق من الخطوة 3
    if (!document.getElementById('email').value || 
        !document.getElementById('phone').value) {
        return false;
    }
    
    // التحقق من معلومات المسافرين
    const passengerCount = parseInt(passengersSelect.value);
    for (let i = 1; i <= passengerCount; i++) {
        const name = document.getElementById(`passengerName${i}`);
        const passport = document.getElementById(`passengerPassport${i}`);
        const dob = document.getElementById(`passengerDOB${i}`);
        
        if (!name || !name.value || !passport || !passport.value || !dob || !dob.value) {
            return false;
        }
    }
    
    // التحقق من الخطوة 5
    if (!document.getElementById('transactionId').value) {
        return false;
    }
    
    return true;
}

// عرض رسالة خطأ
function showError(message) {
    if (!errorMessage) return;
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    window.scrollTo(0, 0);
}

// عرض رسالة نجاح
function showSuccess(message) {
    if (!successMessage) return;
    successMessage.textContent = message;
    successMessage.style.display = 'block';
    window.scrollTo(0, 0);
    
    // إخفاء الرسالة بعد 5 ثواني
    setTimeout(() => {
        successMessage.style.display = 'none';
    }, 5000);
}

// إخفاء رسالة الخطأ
function hideError() {
    if (errorMessage) errorMessage.style.display = 'none';
}

// عرض رسالة تحميل
function showLoading() {
    const submitBtn = document.getElementById('confirmBooking');
    if (!submitBtn) return;
    submitBtn.innerHTML = 'جاري الإرسال...';
    submitBtn.disabled = true;
}

// إخفاء رسالة تحميل
function hideLoading() {
    const submitBtn = document.getElementById('confirmBooking');
    if (!submitBtn) return;
    submitBtn.innerHTML = 'تأكيد الحجز والإرسال';
    submitBtn.disabled = false;
}

// عرض خطوة معينة
function showStep(stepNumber) {
    steps.forEach(step => {
        step.classList.remove('active');
    });
    const targetStep = document.getElementById(`step${stepNumber}`);
    if (targetStep) {
        targetStep.classList.add('active');
    }
    window.scrollTo(0, 0);
    hideError();
}

// محاكاة حفظ البيانات في قاعدة البيانات
function saveToDatabase(formData, reference, totalPrice) {
    const bookingData = {
        reference: reference,
        tripType: document.getElementById('tripType').value,
        departure: document.getElementById('departure').value,
        destination: document.getElementById('destination').value,
        departureDate: document.getElementById('departureDate').value,
        returnDate: document.getElementById('returnDate').value,
        airline: document.getElementById('airline').value,
        passengers: document.getElementById('passengers').value,
        ticketType: selectedTicketType,
        ticketPrice: selectedTicketPrice,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        address: document.getElementById('address').value,
        notes: document.getElementById('notes').value,
        paymentMethod: 'QR Code',
        transactionNumber: document.getElementById('transactionId').value,
        totalPrice: totalPrice,
        timestamp: new Date().toISOString()
    };
    
    // حفظ في LocalStorage (محاكاة لقاعدة البيانات)
    try {
        let bookings = JSON.parse(localStorage.getItem('yamamaBookings') || '[]');
        bookings.push(bookingData);
        localStorage.setItem('yamamaBookings', JSON.stringify(bookings));
        console.log('تم حفظ بيانات الحجز:', bookingData);
    } catch (error) {
        console.error('خطأ في حفظ البيانات:', error);
    }
}

// التهيئة
document.addEventListener('DOMContentLoaded', function() {
    // تحديث حقول التاريخ
    const today = new Date().toISOString().split('T')[0];
    const departureDateElement = document.getElementById('departureDate');
    const returnDateElement = document.getElementById('returnDate');
    
    if (departureDateElement) departureDateElement.min = today;
    if (returnDateElement) returnDateElement.min = today;
    
    // تعيين تاريخ الميلاد الأدنى (18 سنة من الآن)
    const minDOB = new Date();
    minDOB.setFullYear(minDOB.getFullYear() - 100);
    const maxDOB = new Date();
    maxDOB.setFullYear(maxDOB.getFullYear() - 1);
    
    // توليد حقول المسافرين عند التحميل وتغيير العدد
    generatePassengerForms();
    if (passengersSelect) {
        passengersSelect.addEventListener('change', generatePassengerForms);
    }
    
    // إعداد اختيار التذاكر
    setupTicketSelection();
    
    // التنقل بين الخطوات - تم التصحيح هنا
    const nextToStep2 = document.getElementById('nextToStep2');
    if (nextToStep2) {
        nextToStep2.addEventListener('click', function() {
            const departure = document.getElementById('departure');
            const destination = document.getElementById('destination');
            const departureDate = document.getElementById('departureDate');
            
            if (departure && departure.value && 
                destination && destination.value && 
                departureDate && departureDate.value) {
                showStep(2);
            } else {
                let errorMsg = 'يرجى ملء الحقول التالية:';
                if (!departure.value) errorMsg += ' [مدينة المغادرة]';
                if (!destination.value) errorMsg += ' [مدينة الوصول]';
                if (!departureDate.value) errorMsg += ' [تاريخ المغادرة]';
                showError(errorMsg);
            }
        });
    }
    
    const backToStep1 = document.getElementById('backToStep1');
    if (backToStep1) backToStep1.addEventListener('click', () => showStep(1));
    
    const nextToStep3 = document.getElementById('nextToStep3');
    if (nextToStep3) {
        nextToStep3.addEventListener('click', () => {
            if (selectedTicketType) {
                showStep(3);
            } else {
                showError('يرجى اختيار نوع التذكرة أولاً');
            }
        });
    }
    
    const backToStep2 = document.getElementById('backToStep2');
    if (backToStep2) backToStep2.addEventListener('click', () => showStep(2));
    
    const nextToStep4 = document.getElementById('nextToStep4');
    if (nextToStep4) {
        nextToStep4.addEventListener('click', () => {
            let valid = true;
            const passengerCount = parseInt(passengersSelect.value);
            
            for (let i = 1; i <= passengerCount; i++) {
                const name = document.getElementById(`passengerName${i}`);
                const passport = document.getElementById(`passengerPassport${i}`);
                const dob = document.getElementById(`passengerDOB${i}`);
                
                if (!name || !name.value || !passport || !passport.value || !dob || !dob.value) {
                    valid = false;
                    break;
                }
            }
            
            if (valid) {
                showStep(4);
            } else {
                showError('يرجى ملء جميع معلومات المسافرين المطلوبة');
            }
        });
    }
    
    const backToStep3 = document.getElementById('backToStep3');
    if (backToStep3) backToStep3.addEventListener('click', () => showStep(3));
    
    const nextToStep5 = document.getElementById('nextToStep5');
    if (nextToStep5) {
        nextToStep5.addEventListener('click', () => {
            const email = document.getElementById('email');
            const phone = document.getElementById('phone');
            
            if (email && email.value && phone && phone.value) {
                showStep(5);
                updateOrderSummary();
            } else {
                showError('يرجى ملء البريد الإلكتروني ورقم الجوال');
            }
        });
    }
    
    const backToStep4 = document.getElementById('backToStep4');
    if (backToStep4) backToStep4.addEventListener('click', () => showStep(4));
    
    const newBooking = document.getElementById('newBooking');
    if (newBooking) newBooking.addEventListener('click', () => {
        location.reload();
    });
    
    // تحديث معلومات البنك بناءً على الاختيار
    document.querySelectorAll('input[name="Payment_Method"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const bankInfo = document.getElementById('bankInfo');
            if (!bankInfo) return;
            
            const accountDetails = bankInfo.querySelector('.account-details');
            if (!accountDetails) return;
            
            switch(this.value) {
                case 'الراجحي':
                    accountDetails.innerHTML = `
                        <p><strong>بنك الراجحي:</strong></p>
                        <p>رقم الحساب: <strong>SA0380000000608010207879</strong></p>
                        <p>اسم المستفيد: <strong>اليمامة للطيران</strong></p>
                    `;
                    break;
                case 'الأنماء':
                    accountDetails.innerHTML = `
                        <p><strong>بنك الأنماء:</strong></p>
                        <p>رقم الحساب: <strong>SA6305000068206733958000</strong></p>
                        <p>اسم المستفيد: <strong>اليمامة للطيران</strong></p>
                    `;
                    break;
                case 'الأهلي':
                    accountDetails.innerHTML = `
                        <p><strong>البنك الأهلي:</strong></p>
                        <p>رقم الحساب: <strong>SA0710000001301010101010</strong></p>
                        <p>اسم المستفيد: <strong>اليمامة للطيران</strong></p>
                    `;
                    break;
                default:
                    accountDetails.innerHTML = `
                        <p><strong>${this.value}:</strong></p>
                        <p>رقم الحساب: <strong>SAXX0000000000000000000</strong></p>
                        <p>اسم المستفيد: <strong>اليمامة للطيران</strong></p>
                    `;
            }
        });
    });
    
    // عرض الخطوة الأولى عند التحميل
    showStep(1);
    
    console.log('تم تحميل نظام الحجز بنجاح!');
});
