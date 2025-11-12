        // العناصر الرئيسية
        const steps = document.querySelectorAll('.step');
        const nextToStep2 = document.getElementById('nextToStep2');
        const nextToStep3 = document.getElementById('nextToStep3');
        const nextToStep4 = document.getElementById('nextToStep4');
        const nextToStep5 = document.getElementById('nextToStep5'); // زر الإرسال
        const backToStep1 = document.getElementById('backToStep1');
        const backToStep2 = document.getElementById('backToStep2');
        const backToStep3 = document.getElementById('backToStep3');
        const newBooking = document.getElementById('newBooking');
        const passengerForms = document.getElementById('passengerForms');
        const passengersSelect = document.getElementById('passengers');
        const bookingForm = document.getElementById('bookingForm'); // وسم الفورم
        
        // الانتقال بين الخطوات (تم تغيير type="button" لمنع الإرسال المبكر)
        nextToStep2.addEventListener('click', () => showStep(2));
        nextToStep3.addEventListener('click', () => {
            generatePassengerForms();
            showStep(3);
        });
        nextToStep4.addEventListener('click', () => showStep(4));
        
        backToStep1.addEventListener('click', () => showStep(1));
        backToStep2.addEventListener('click', () => showStep(2));
        backToStep3.addEventListener('click', () => showStep(3));
        
        newBooking.addEventListener('click', () => {
            resetForm();
            showStep(1);
        });
        
        // معالجة إرسال النموذج (للتكامل مع Formspree)
        bookingForm.addEventListener('submit', async function(e) {
            e.preventDefault(); // منع الإرسال الافتراضي

            // 1. توليد رقم الحجز قبل الإرسال
            generateBookingReference();
            
            // 2. إرسال النموذج إلى Formspree عبر Fetch API
            const formData = new FormData(bookingForm);
            
            // إضافة رقم الحجز إلى بيانات النموذج المرسلة
            formData.append('Booking_Reference', document.getElementById('bookingReference').textContent);

            const response = await fetch(bookingForm.action, {
                method: bookingForm.method,
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                // إذا نجح الإرسال، انتقل إلى خطوة التأكيد
                showStep(5);
            } else {
                // في حالة وجود خطأ
                // هذا التنبيه سيظهر إذا لم يتم تأكيد النموذج على Formspree بعد
                alert('حدث خطأ في إرسال بيانات الحجز. يرجى التأكد من تأكيد نموذج Formspree في إيميلك.');
            }
        });

        // توليد حقول المسافرين ديناميكياً مع أسماء (name) لـ Formspree
        function generatePassengerForms() {
            const passengerCount = parseInt(passengersSelect.value);
            passengerForms.innerHTML = '';
            
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
                    <hr style="margin: 15px 0;">
                `;
                passengerForms.appendChild(passengerForm);
            }
        }
        
        // توليد رقم حجز عشوائي
        function generateBookingReference() {
            const prefix = 'YA'; // يرمز لليمامة
            const year = new Date().getFullYear();
            const randomNum = Math.floor(100000 + Math.random() * 900000);
            document.getElementById('bookingReference').textContent = `${prefix}-${year}-${randomNum}`;
        }
        
        // إعادة تعيين النموذج
        function resetForm() {
            bookingForm.reset();
            passengerForms.innerHTML = '';
        }
        
        // عرض خطوة معينة وإخفاء الآخرين
        function showStep(stepNumber) {
            steps.forEach(step => {
                step.classList.add('hidden');
            });
            document.getElementById(`step${stepNumber}`).classList.remove('hidden');
        }
        
        // تهيئة الصفحة عند التحميل
        document.addEventListener('DOMContentLoaded', () => {
            // تهيئة حقول التاريخ للبدء من تاريخ اليوم
            const today = new Date().toISOString().split('T')[0];
            const departureDateElement = document.getElementById('departureDate');
            const returnDateElement = document.getElementById('returnDate');
            
            if (departureDateElement) departureDateElement.min = today;
            if (returnDateElement) returnDateElement.min = today;
            
            // إضافة مستمع لتحديث حقول المسافرين عند تغيير العدد
            passengersSelect.addEventListener('change', generatePassengerForms);
            
            // عرض الخطوة الأولى عند التحميل
            showStep(1); 
        });
