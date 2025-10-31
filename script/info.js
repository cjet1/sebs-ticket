// /script/info.js

// ----------------------------------------------------
// 0. 유틸리티 함수: 예약 번호 생성 (변경 없음)
// ----------------------------------------------------
/**
 * 10자리 길이의 예약 번호를 생성합니다. (타임스탬프 + 랜덤 숫자)
 * @returns {number} 10자리 정수 예약 번호
 */
function createReservationId() {
    // 현재 시간을 초 단위로 가져옴 (10자리)
    const timestamp = Math.floor(Date.now() / 1000); 
    
    // 타임스탬프의 끝 6자리만 사용 (예: 773342)
    const shortTimestamp = String(timestamp).slice(-6); 
    
    // 4자리의 랜덤 숫자 생성 (0000 ~ 9999)
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    // 두 값을 결합하여 10자리 예약 ID 생성
    return parseInt(shortTimestamp + random, 10);
}


// ----------------------------------------------------
// 1. 설정 로드 및 Firebase 초기화 함수 (익명 인증 코드 제거)
// ----------------------------------------------------
async function initializeFirebase() {
    if (typeof firebase === 'undefined') {
        console.error("❌ Firebase SDK 로드 안 됨.");
        alert("Firebase SDK 로딩에 실패했습니다. HTML 파일을 확인하세요.");
        return { database: null, MAX_CAPACITY: 10 };
    }

    let config = null;
    let errorLog = [];

    try {
        // config.json 파일 로드 로직 (경로 시도)
        let response = await fetch('../config.json');
        if (!response.ok) {
            errorLog.push(`1차 시도 실패: ${response.status} ${response.statusText}`);
            response = await fetch('/config.json');
            if (!response.ok) {
                errorLog.push(`2차 시도 실패: ${response.status} ${response.statusText}`);
                throw new Error("config.json 파일 로드에 실패했습니다. (경로 확인 필요)");
            }
        }

        config = await response.json();

        // 3단계: 초기화 실행 (익명 인증 코드 제거됨)
        if (!firebase.apps.length) {
            firebase.initializeApp(config.firebaseConfig);
        }
            
        // 4단계: Database 객체 가져오기 (Realtime DB)
        const database = firebase.database();
        
        console.log("✅ Firebase 초기화 및 Database 연결 성공!");
        return { database, MAX_CAPACITY: config.maxCapacity || 10 };

    } catch (error) {
        if (errorLog.length > 0) {
            console.error("⚠️ config.json 로드 상세 시도 결과:", errorLog.join(' / '));
        }
        console.error("❌ Firebase 초기화 실패:", error.message || error);
        alert("시스템 로딩에 문제가 발생했습니다. 브라우저 콘솔을 확인하세요.");
        return { database: null, MAX_CAPACITY: 10 };
    }
}


// ----------------------------------------------------
// 2. 메인 로직 (DOMContentLoaded) - 로직 변경 없음
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
    
    const { database, MAX_CAPACITY } = await initializeFirebase();

    // ----------------------------------------------------
    // 2-1. URL 매개변수 및 DOM 설정
    // ----------------------------------------------------
    const urlParams = new URLSearchParams(window.location.search);
    const selectedTime = urlParams.get('time');
    const boothId = urlParams.get('booth');

    if (!selectedTime || !database) {
        alert('예약 정보가 유효하지 않거나 시스템 연결에 문제가 있습니다. 다시 시도해주세요.');
        // window.location.href = './reserve.html'; // 🚨 리디렉션 주석 처리하여 오류 디버깅 용이하게 함
        // return;
    }

    const timeDisplay = document.getElementById('final-selected-time');
    const capacityDisplay = document.getElementById('max-capacity-display');
    const backBtn = document.getElementById('back-to-terms');
    const finalConfirmBtn = document.getElementById('final-reserve-confirm-btn');

    const inputStudentId = document.getElementById('input-student-id');
    const inputName = document.getElementById('input-name');
    const inputPhone = document.getElementById('input-phone');
    const inputPartySize = document.getElementById('input-party-size');
    const emailInput = document.getElementById('input-email'); 
    const emailGuide = document.getElementById('email-format-guide'); 

    if (timeDisplay) timeDisplay.textContent = selectedTime;
    if (capacityDisplay) capacityDisplay.textContent = MAX_CAPACITY;
    if (inputPartySize) inputPartySize.setAttribute('max', MAX_CAPACITY); 
    
    // 뒤로가기 버튼에 이전 페이지 URL 설정
    if (backBtn) backBtn.href = `./terms.html?time=${selectedTime}&booth=${boothId}`; 

// ----------------------------------------------------
// 2-2. 유효성 검사 및 버튼 활성화 로직 (변경 없음)
// ----------------------------------------------------
const checkFormValidity = () => {
    const studentId = inputStudentId.value.trim();
    const name = inputName.value.trim();
    const phone = inputPhone.value.trim();
    const partySize = parseInt(inputPartySize.value, 10);
    const email = emailInput ? emailInput.value.trim() : 'dummy@example.com';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmailValid = emailRegex.test(email);

    if (emailInput) {
        if (email === '') {
            emailGuide.textContent = '이메일 주소를 입력해 주세요.';
            emailGuide.style.color = '#777';
        } else if (!isEmailValid) {
            emailGuide.textContent = '올바른 이메일 형식을 사용해 주세요. 예) user@school.ac.kr';
            emailGuide.style.color = '#ff4747';
            emailInput.closest('.form-group')?.classList.add('error'); 
        } else {
            emailGuide.textContent = '예) user@cjetlab.xyz';
            emailGuide.style.color = '#03c75a';
            emailInput.closest('.form-group')?.classList.remove('error');
        }
    }

    const isValid = studentId && 
                    name && 
                    phone && 
                    (emailInput ? isEmailValid : true) && 
                    partySize >= 1 && 
                    partySize <= MAX_CAPACITY;
    
    if (finalConfirmBtn) finalConfirmBtn.disabled = !isValid;
    return isValid;
};

// 입력 필드 변경 시마다 유효성 검사
const formInputs = [inputStudentId, inputName, inputPhone, inputPartySize];
if (emailInput) formInputs.push(emailInput);

formInputs.forEach(element => {
    element.addEventListener('input', checkFormValidity);
    element.addEventListener('blur', checkFormValidity);
});
    
    // ----------------------------------------------------
    // 2-3. 최종 예약 처리 (로직 변경 없음)
    // ----------------------------------------------------
    if (finalConfirmBtn) finalConfirmBtn.addEventListener('click', async () => { 
        checkFormValidity();
        if (finalConfirmBtn.disabled) {
            alert('모든 필수 정보를 올바르게 입력해주세요.');
            return;
        }
        
        // 버튼 잠금 및 텍스트 변경
        finalConfirmBtn.disabled = true;
        finalConfirmBtn.textContent = '처리 중...';

        const studentId = inputStudentId.value.trim();
        const partySize = parseInt(inputPartySize.value, 10);
        
        const reservationId = createReservationId(); 

        const reservationData = {
            reservationId: reservationId, 
            studentId: studentId,
            name: inputName.value.trim(),
            phone: inputPhone.value.trim(),
            partySize: partySize,
            email: emailInput ? emailInput.value.trim() : 'NO_EMAIL',
            timestamp: firebase.database.ServerValue.TIMESTAMP
        };
        
        const slotCountRef = database.ref('booths/' + boothId + '/slots/' + selectedTime);
        const reservationsRef = database.ref('reservations'); 

        // ------------------------------------------------
        // 🌟 1단계: 학번 중복 예약 검사
        // ------------------------------------------------
        try {
            console.log(`➡️ 중복 예약 검사 시작: 학번 ${studentId}`);
            
            const snapshot = await reservationsRef
                .orderByChild('studentId')
                .equalTo(studentId)
                .once('value');

            if (snapshot.exists()) {
                alert(`🚨 ${studentId} 학번으로는 이미 예약이 존재합니다. 중복 예약은 불가능합니다.`);
                console.warn(`❌ 중복 예약 시도: 학번 ${studentId}`);
                finalConfirmBtn.disabled = false;
                finalConfirmBtn.textContent = '예약 최종 확정하기';
                return; 
            }
            
            console.log(`✅ 중복 검사 통과. 예약 진행.`);

        } catch (error) {
            console.error("❌ 중복 검사 중 Firebase 오류:", error);
            alert('예약 검사 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
            finalConfirmBtn.disabled = false;
            finalConfirmBtn.textContent = '예약 최종 확정하기';
            return;
        }

        // ------------------------------------------------
        // 🌟 2단계: 트랜잭션을 사용하여 인원수 업데이트
        // ------------------------------------------------
        slotCountRef.transaction(async (currentCount) => {
            const remainingCapacity = currentCount === null ? MAX_CAPACITY : currentCount;
            const newRemainingCapacity = remainingCapacity - partySize;

            if (newRemainingCapacity >= 0) {
                return newRemainingCapacity; 
            } else {
                return undefined; 
            }
        }, async (error, committed, snapshot) => {
            if (error) {
                console.error("❌ Firebase 트랜잭션 오류:", error);
                alert('예약 중 오류가 발생했습니다: ' + error.message);
                finalConfirmBtn.disabled = false;
                finalConfirmBtn.textContent = '예약 최종 확정하기';
            } else if (!committed) {
                const availableSeats = snapshot.val() !== null ? snapshot.val() : MAX_CAPACITY;
                alert(`죄송합니다. ${selectedTime} 부스는 정원 초과로 예약할 수 없습니다.\n현재 잔여 좌석: ${availableSeats}석`);
                finalConfirmBtn.disabled = false;
                finalConfirmBtn.textContent = '예약 최종 확정하기';
            } else {
                // 인원수 업데이트 성공 시, 예약자 정보 저장
                try {
                    const newReservationRef = reservationsRef.push();
                    await newReservationRef.set({
                        boothId: boothId,
                        timeSlot: selectedTime,
                        ...reservationData 
                    });

                    alert(`[셉스티켓] ${selectedTime} 코딩 체험 부스를 예약했습니다! (${partySize}명)\n\n🎉 예약 번호: ${reservationId} 🎉\n\n감사합니다.`);
                    console.log("✅ 예약 성공 및 정보 저장 완료. 예약 번호:", reservationId);

                    window.location.href = './reserve.html';

                } catch (infoError) {
                    console.error("❌ 예약 정보 저장 실패:", infoError);
                    alert("예약은 되었으나 정보 저장에 실패했습니다. 관리자에게 문의하세요.");
                    finalConfirmBtn.disabled = false;
                    finalConfirmBtn.textContent = '예약 최종 확정하기';
                }
            }
        });
    });
});