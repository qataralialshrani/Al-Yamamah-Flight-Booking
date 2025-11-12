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
    document.getElementById('totalPrice').textContent = `السعر الإجمالي: ${totalAmount} ر.س`;
    document.getElementById('finalPrice').textContent = `المبلغ الإجمالي: ${totalAmount} ر.س`;
    document.getElementById('paymentAmount').textContent = `${totalAmount} ر.س`;
    
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
            <p><strong>المبلغ المدفوع:</strong> ${totalAmount} ر
