// ../script/reserve.js

// ----------------------------------------------------
// 1. 설정 로드 및 Firebase 초기화 함수 (config.json 사용)
// ----------------------------------------------------
async function initializeFirebase() {
    // 1단계: Firebase SDK가 로드되었는지 확인
    if (typeof firebase === 'undefined') {
        console.error("❌ Firebase SDK 로드 안 됨: HTML 파일에서 Firebase CDN 스크립트를 확인하세요.");
        alert("Firebase SDK 로딩에 실패했습니다. HTML 파일의 <script> 태그를 확인하세요.");
        return { database: null, MAX_CAPACITY: 10 };
    }
    
    try {
        // 🛠️ 경로 수정: '../config.json'을 사용하여 상위 폴더의 파일을 찾습니다.
        const response = await fetch('../config.json'); 
        if (!response.ok) {
            throw new Error(`config.json 파일을 불러오지 못했습니다: ${response.statusText}`);
        }
        const config = await response.json();
        
        // Firebase 앱이 이미 초기화되었는지 확인 (중복 초기화 방지)
        if (!firebase.apps.length) {
            firebase.initializeApp(config.firebaseConfig);
        }
        
        const database = firebase.database();

        console.log("✅ Firebase 초기화 성공!");
        
        // MAX_CAPACITY 값이 없으면 기본값 10을 사용 (안전성 확보)
        return { database, MAX_CAPACITY: config.maxCapacity || 10 }; 
        
    } catch (error) {
        console.error("❌ Firebase 초기화 실패:", error);
        alert("예약 시스템 로딩에 문제가 발생했습니다. 관리자에게 문의하세요.");
        return { database: null, MAX_CAPACITY: 10 }; 
    }
}


// ----------------------------------------------------
// 2. 메인 로직 (DOMContentLoaded)
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
    console.log("➡️ DOMContentLoaded: 스크립트 실행 시작.");

    const { database, MAX_CAPACITY } = await initializeFirebase();

    if (!database) {
        return; 
    }

    // ----------------------------------------------------
    // 초기 변수 설정 및 DOM 요소 선택
    // ----------------------------------------------------
    const boothId = 'CR1'; 
    const timeSlotsContainer = document.querySelector('.time-slots');
    const selectedTimeDisplay = document.getElementById('selected-time');
    const finalReserveBtn = document.getElementById('final-reserve-btn');

    let selectedTime = null;

    // ----------------------------------------------------
    // 시간대 버튼 클릭 이벤트 처리 (이벤트 위임 적용)
    // ----------------------------------------------------
    timeSlotsContainer.addEventListener('click', (e) => {
        const target = e.target.closest('.time-slot'); 
        
        if (!target || target.disabled || target.getAttribute('data-status') !== 'available') {
            return;
        }

        document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
        target.classList.add('selected');

        selectedTime = target.getAttribute('data-time');
        selectedTimeDisplay.textContent = selectedTime;
        finalReserveBtn.disabled = false;
        
        console.log(`✅ 시간 선택: ${selectedTime}`);
    });


    // ----------------------------------------------------
    // 1단계: 최종 예약 버튼 클릭 -> 약관 페이지(terms.html)로 이동
    // ----------------------------------------------------
    finalReserveBtn.addEventListener('click', () => {
        if (!selectedTime) {
            alert('예약 시간을 선택해주세요.');
            return;
        }
        
        // ⚠️ 핵심: 선택된 시간을 URL 매개변수로 다음 페이지에 전달
        const nextUrl = `./terms.html?time=${selectedTime}&booth=${boothId}`;
        window.location.href = nextUrl;
        
        console.log(`➡️ 다음 단계로 이동: ${nextUrl}`);
    });


    // ----------------------------------------------------
    // Firebase 데이터 실시간 읽기 및 UI 업데이트 (슬롯 로직 수정)
    // ----------------------------------------------------
    const boothRef = database.ref('booths/' + boothId + '/slots');
    
    boothRef.on('value', (snapshot) => {
        const slotsData = snapshot.val();
        console.log("➡️ Firebase 데이터 수신 완료:", slotsData);
        console.log("Slots Data:", slotsData)

        timeSlotsContainer.innerHTML = '';
        
        let isPreviouslySelected = false;

        // 🌟 수정: 이전에 선택된 시간의 잔여 인원을 다시 계산
        if (selectedTime) {
            const currentRemaining = slotsData && slotsData[selectedTime] !== null 
                ? slotsData[selectedTime] 
                : MAX_CAPACITY; // DB 값이 null이면 MAX_CAPACITY로 간주
            
            if (currentRemaining > 0) {
                isPreviouslySelected = true;
            } else {
                // 선택했던 시간이 마감되었다면 선택 초기화
                selectedTime = null; 
            }
        }

        finalReserveBtn.disabled = true;
        selectedTimeDisplay.textContent = '선택 안 됨';

        if (!slotsData) {
            timeSlotsContainer.innerHTML = '<p>현재 예약 가능한 시간대가 없습니다.</p>';
            return; 
        }

        let availableCount = 0;
        Object.keys(slotsData).sort().forEach(time => {
            // 🌟🌟 핵심 수정 🌟🌟
            // 'info.js'에서 DB에 잔여 인원(Remaining)을 저장하므로,
            // DB에서 가져온 값이 곧 잔여 인원입니다.
            const remaining = slotsData[time] === null ? MAX_CAPACITY : slotsData[time];

            const isAvailable = remaining > 0;
            const statusText = isAvailable ? `(${remaining}/${MAX_CAPACITY})` : '(마감)';

            const button = document.createElement('button');
            button.className = 'time-slot';
            button.setAttribute('data-time', time);
            button.setAttribute('data-status', isAvailable ? 'available' : 'unavailable');
            button.textContent = `${time} ${statusText}`;
            
            if (!isAvailable) {
                button.disabled = true;
            } else {
                availableCount++;
                if (isPreviouslySelected && selectedTime === time) {
                    button.classList.add('selected');
                    selectedTimeDisplay.textContent = selectedTime;
                    finalReserveBtn.disabled = false;
                }
            }

            timeSlotsContainer.appendChild(button);
        });
        console.log(`➡️ ${availableCount}개의 예약 가능 시간 버튼 생성 완료.`);
    });
});