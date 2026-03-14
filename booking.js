function showStep(id) {
    document.querySelectorAll('.booking-step').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

const checkin = document.getElementById('checkin');
const checkout = document.getElementById('checkout');
const findRoomsBtn = document.getElementById('findRoomsBtn');
const roomsList = document.getElementById('rooms-list');
const proceedBtn = document.getElementById('proceedBtn');
const nextToPaymentBtn = document.getElementById('nextToPaymentBtn');
const confirmBookingBtn = document.getElementById('confirmBookingBtn');
const statusDiv = document.getElementById('status');
let selectedRoomIds = [];

checkin.min = new Date().toISOString().split('T')[0];
checkin.addEventListener('change', (e) => {
    checkout.min = e.target.value;
    const d = new Date(e.target.value);
    d.setDate(d.getDate() + 1);
    checkout.value = d.toISOString().split('T')[0];
});

findRoomsBtn.onclick = async () => {
    const start = checkin.value;
    const end = checkout.value;
    if(!start || !end) return alert('Select dates');

    const { data: allRooms } = await _mySupabase.from('rooms').select('*');
    const { data: bookings } = await _mySupabase.from('bookings').select('room_id').or(`and(check_in.lte.${end},check_out.gte.${start})`);
    const bookedIds = bookings ? bookings.map(b => b.room_id) : [];
    
    roomsList.innerHTML = '';
    allRooms.forEach(room => {
        if (!bookedIds.includes(room.id)) {
            const div = document.createElement('div');
            div.className = 'room-card';
            div.onclick = () => {
                div.classList.toggle('selected');
                const roomObj = {id: room.id, price: room.price};
                if (selectedRoomIds.find(r => r.id === room.id)) selectedRoomIds = selectedRoomIds.filter(r => r.id !== room.id);
                else selectedRoomIds.push(roomObj);
            };
            div.innerHTML = `Room ${room.id} (${room.type}) - ₹${room.price}`;
            roomsList.appendChild(div);
        }
    });
    showStep('step-rooms');
};

proceedBtn.onclick = () => { if (selectedRoomIds.length === 0) return alert('Select a room'); showStep('step-details'); };

nextToPaymentBtn.onclick = () => {
    const name = document.getElementById('guestName').value;
    const phone = document.getElementById('whatsapp').value;
    if (!name || !phone) return alert('Fill guest name and WhatsApp number');
    
    const start = new Date(checkin.value);
    const end = new Date(checkout.value);
    const nights = Math.max(1, (end - start) / (1000 * 60 * 60 * 24));
    
    let summaryHtml = `<h4>Booking Summary:</h4><ul>`;
    let total = 0;
    
    selectedRoomIds.forEach(r => {
        const roomTotal = parseFloat(r.price) * nights;
        total += roomTotal;
        summaryHtml += `<li>Room ${r.id}: ₹${r.price} x ${nights} nights = ₹${roomTotal}</li>`;
    });
    
    summaryHtml += `</ul><h3>Total Payable: ₹${total}</h3>`;
    document.getElementById('payment-summary').innerHTML = summaryHtml;
    
    showStep('step-payment');
};

confirmBookingBtn.onclick = async () => {
    confirmBookingBtn.disabled = true;
    confirmBookingBtn.innerText = "Submitting...";
    const name = document.getElementById('guestName').value;
    const phone = document.getElementById('whatsapp').value;
    const bookingId = Math.random().toString(36).substr(2, 9).toUpperCase();
    for (const r of selectedRoomIds) {
        await _mySupabase.from('bookings').insert([{ booking_id: bookingId, room_id: r.id, guest_name: name, whatsapp: phone, check_in: checkin.value, check_out: checkout.value, price: r.price }]);
    }
    statusDiv.innerHTML = `Booking submitted! ID: ${bookingId}<br><button class="action-btn" onclick="printBookingInvoice('${bookingId}')">Print Receipt</button>`;
    confirmBookingBtn.style.display = 'none'; // Button disappears here
};

window.printBookingInvoice = async (id) => {
    const { data: bks } = await _mySupabase.from('bookings').select('*');
    const group = bks.filter(x => x.booking_id === id);
    const b = group[0];
    const total = group.reduce((acc, curr) => acc + (parseFloat(curr.price) || 0), 0);
    const w = window.open('invoice_template.html');
    w.onload = () => {
        const doc = w.document;
        // Populate existing IDs
        doc.getElementById('guest_name').innerText = b.guest_name;
        doc.getElementById('whatsapp').innerText = b.whatsapp;
        doc.getElementById('booking_id').innerText = b.booking_id;
        doc.getElementById('check_in').innerText = b.check_in;
        doc.getElementById('check_out').innerText = b.check_out;
        doc.getElementById('price').innerText = '₹' + total.toFixed(2);
        doc.getElementById('grand_total').innerText = '₹' + total.toFixed(2);
        doc.getElementById('balance').innerText = '₹' + total.toFixed(2);
        doc.getElementById('room_desc').innerText = 'Room(s): ' + group.map(x => x.room_id).join(', ');
        
        // Populate GST if elements exist
        const gstNum = doc.getElementById('gst_number');
        if (gstNum) gstNum.innerText = window.gst_number || 'N/A';
        const gstPercent = doc.getElementById('gst_percent');
        if (gstPercent) gstPercent.innerText = window.gst_percent || 0;
        
        setTimeout(() => w.print(), 500);
    };
};
