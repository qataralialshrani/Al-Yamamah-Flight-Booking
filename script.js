// العناصر الرئيسية
const steps = document.querySelectorAll('.step');
const errorMessage = document.getElementById('errorMessage');
const bookingForm = document.getElementById('bookingForm'); 
const passengersSelect = document.getElementById('passengers');

// إرسال بيانات الحجز إلى Formspree بعد التحقق
bookingForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // التحقق من جميع الحقول المطلوبة
    if (!validateForm()) {
        showError('يرجى ملء جميع الحقول المطلوبة بشكل صحيح');
        return;
    }
    
    // توليد رقم الحجز وإضافته للبيانات المرسلة
    const ref = generateBookingReference();
    document.getElementById('bookingReference').textContent = ref;
    
    // إضافة حقل مخفي لـ Formspree
    const refInput = document.createElement('input');
    refInput.type = 'hidden';
    refInput.name = 'Booking_Reference';
    refInput.value = ref;
    bookingForm.appendChild(refInput);

    // إضافة معلومات إضافية
    const totalPrice = calculateTotalPrice();
    const priceInput = document.createElement('input');
    priceInput.type = 'hidden';
    priceInput.name = 'Total_Price';
    priceInput.value = totalPrice;
    bookingForm.appendChild(priceInput);

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
            // الانتقال إلى صفحة التأكيد
            setTimeout(() => {
                hideLoading();
                showStep(4);
                
                // إرسال بيانات إضافية إلى قاعدة البيانات (محاكاة)
                saveToDatabase(formData, ref, totalPrice);
                
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

// توليد حقول المسافرين ديناميكياً
function generatePassengerForms() {
    const passengerCount = parseInt(passengersSelect.value);
    const container = document.getElementById('passengerForms');
    container.innerHTML = '';
    
    for (let i = 1; i <= passengerCount; i++) {
        const passengerForm = document.createElement('div');
        passengerForm.className = 'passenger-form';
        passengerForm.innerHTML = `
            <h3>المسافر ${i}</h3>
            <div class="form-group">
                <label for="passengerName${i}">الاسم الكامل:</label>
                <input type="text" id="passengerName${i}" name="Passenger_${i}_Name" required>
            </div>
            <div class="form-group">
                <label for="passengerPassport${i}">رقم الجواز:</label>
                <input type="text" id="passengerPassport${i}" name="Passenger_${i}_Passport" required>
            </div>
            <div class="form-group">
                <label for="passengerDOB${i}">تاريخ الميلاد:</label>
                <input type="date" id="passengerDOB${i}" name="Passenger_${i}_DOB" required>
            </div>
            ${i < passengerCount ? '<hr style="margin: 15px 0;">' : ''}
        `;
        container.appendChild(passengerForm);
    }
}

// توليد رقم حجز عشوائي
function generateBookingReference() {
    const prefix = 'YM'; 
    const year = new Date().getFullYear();
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    return `${prefix}-${year}-${randomNum}`;
}

// حساب السعر الإجمالي
function calculateTotalPrice() {
    const passengerCount = parseInt(passengersSelect.value);
    const seatClass = document.getElementById('seatClass').value;
    
    let basePrice = 500; // سعر أساسي
    let classMultiplier = 1;
    
    switch(seatClass) {
        case 'premium_economy':
            classMultiplier = 1.5;
            break;
        case 'business':
            classMultiplier = 2.5;
            break;
        case 'first':
            classMultiplier = 4;
            break;
    }
    
    return (basePrice * classMultiplier * passengerCount).toFixed(2);
}

// التحقق من صحة النموذج
function validateForm() {
    // التحقق من الخطوة 1
    if (!document.getElementById('departure').value || 
        !document.getElementById('destination').value || 
        !document.getElementById('departureDate').value) {
        return false;
    }
    
    // التحقق من الخطوة 2
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
    
    // التحقق من الخطوة 3
    if (!document.getElementById('transactionNumber').value || 
        !document.getElementById('receipt').files.length) {
        return false;
    }
    
    return true;
}

// عرض رسالة خطأ
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    window.scrollTo(0, 0);
}

// إخفاء رسالة الخطأ
function hideError() {
    errorMessage.style.display = 'none';
}

// عرض رسالة تحميل
function showLoading() {
    const submitBtn = document.getElementById('confirmBooking');
    submitBtn.innerHTML = 'جاري الإرسال...';
    submitBtn.disabled = true;
}

// إخفاء رسالة تحميل
function hideLoading() {
    const submitBtn = document.getElementById('confirmBooking');
    submitBtn.innerHTML = 'تأكيد الحجز والإرسال';
    submitBtn.disabled = false;
}

// عرض خطوة معينة
function showStep(stepNumber) {
    steps.forEach(step => {
        step.classList.remove('active');
    });
    document.getElementById(`step${stepNumber}`).classList.add('active');
    window.scrollTo(0, 0);
    hideError();
}

// محاكاة حفظ البيانات في قاعدة البيانات
function saveToDatabase(formData, reference, totalPrice) {
    const bookingData = {
        reference: reference,
        departure: document.getElementById('departure').value,
        destination: document.getElementById('destination').value,
        departureDate: document.getElementById('departureDate').value,
        returnDate: document.getElementById('returnDate').value,
        passengers: document.getElementById('passengers').value,
        seatClass: document.getElementById('seatClass').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        paymentMethod: document.querySelector('input[name="Payment_Method"]:checked').value,
        transactionNumber: document.getElementById('transactionNumber').value,
        totalPrice: totalPrice,
        timestamp: new Date().toISOString()
    };
    
    // حفظ في LocalStorage (محاكاة لقاعدة البيانات)
    let bookings = JSON.parse(localStorage.getItem('yamamaBookings') || '[]');
    bookings.push(bookingData);
    localStorage.setItem('yamamaBookings', JSON.stringify(bookings));
    
    console.log('تم حفظ بيانات الحجز:', bookingData);
}

// التهيئة
document.addEventListener('DOMContentLoaded', function() {
    // تحديث حقول التاريخ
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('departureDate').min = today;
    document.getElementById('returnDate').min = today;
    
    // تعيين تاريخ الميلاد الأدنى (18 سنة من الآن)
    const minDOB = new Date();
    minDOB.setFullYear(minDOB.getFullYear() - 100);
    document.querySelectorAll('input[type="date"]').forEach(input => {
        if (input.id.includes('DOB')) {
            input.max = new Date().toISOString().split('T')[0];
            input.min = minDOB.toISOString().split('T')[0];
        }
    });
    
    // توليد حقول المسافرين عند التحميل وتغيير العدد
    generatePassengerForms();
    passengersSelect.addEventListener('change', generatePassengerForms);
    
    // التنقل بين الخطوات
    document.getElementById('nextToStep2').addEventListener('click', function() {
        if (document.getElementById('departure').value && 
            document.getElementById('destination').value && 
            document.getElementById('departureDate').value) {
            showStep(2);
        } else {
            showError('يرجى ملء جميع حقول بيانات الرحلة المطلوبة');
        }
    });
    
    document.getElementById('backToStep1').addEventListener('click', () => showStep(1));
    
    document.getElementById('nextToStep3').addEventListener('click', () => {
        let valid = true;
        const passengerCount = parseInt(passengersSelect.value);
        
        for (let i = 1; i <= passengerCount; i++) {
            const name = document.getElementById(`passengerName${i}`);
            const passport = document.getElementById(`passengerPassport${i}`);
            const dob = document.getElementById(`passengerDOB${i}`);
            
            if (!name.value || !passport.value || !dob.value) {
                valid = false;
                break;
            }
        }
        
        if (document.getElementById('email').value && 
            document.getElementById('phone').value && valid) {
            showStep(3);
        } else {
            showError('يرجى ملء جميع معلومات الاتصال والمسافرين');
        }
    });
    
    document.getElementById('backToStep2').addEventListener('click', () => showStep(2));
    
    document.getElementById('newBooking').addEventListener('click', () => {
        location.reload();
    });
    
    // تحديث معلومات البنك بناءً على الاختيار
    document.querySelectorAll('input[name="Payment_Method"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const bankInfo = document.getElementById('bankInfo');
            const accountDetails = bankInfo.querySelector('.account-details');
            
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
});
