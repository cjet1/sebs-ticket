// /script/terms.js

// ----------------------------------------------------
// 1. 설정 로드 및 Firebase 초기화 함수
// ----------------------------------------------------
async function initializeFirebase() {
    // Firebase SDK 로드 검사
    if (typeof firebase === 'undefined') {
        console.error("❌ Firebase SDK 로드 안 됨: HTML 파일에서 Firebase CDN 스크립트를 확인하세요.");
        return { database: null, MAX_CAPACITY: 10 };
    }

    let config = null;
    try {
        // config.json 로드 (경로 대체 시도)
        let response = await fetch('../config.json');
        if (!response.ok) {
            response = await fetch('/config.json');
            if (!response.ok) {
                throw new Error("config.json 파일 로드에 실패했습니다.");
            }
        }
        config = await response.json();
        
        // 초기화
        if (!firebase.apps.length) {
            firebase.initializeApp(config.firebaseConfig);
        }
        
        const database = firebase.database();
        return { database, MAX_CAPACITY: config.maxCapacity || 10 };

    } catch (error) {
        console.error("❌ Firebase 초기화 실패:", error.message || error);
        return { database: null, MAX_CAPACITY: 10 };
    }
}


// ----------------------------------------------------
// 2. 메인 로직 (DOMContentLoaded)
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
    
    // Firebase 초기화 (비동기 처리)
    const { database, MAX_CAPACITY } = await initializeFirebase(); 

    // ----------------------------------------------------
    // 2-1. URL 매개변수 및 DOM 설정
    // ----------------------------------------------------
    const urlParams = new URLSearchParams(window.location.search);
    const selectedTime = urlParams.get('time');
    const boothId = urlParams.get('booth');

    // 시간 정보 유효성 검사
    if (!selectedTime) {
        alert('선택된 예약 시간이 없습니다. 시간을 다시 선택해주세요.');
        window.location.href = './reserve.html';
        return;
    }

    // DOM 요소 선택
    const timeDisplay = document.getElementById('selected-time-display'); 
    const termsAgree = document.getElementById('terms-agree');
    const nextStepBtn = document.getElementById('next-step-btn');

    // 🌟 필수 약관 체크박스 (ID: term1-agree 가정)
    const requiredTerm = document.getElementById('term1-agree'); 
    
    // 모든 개별 약관 체크박스 (전체 동의 토글 기능에 사용, class: individual-term-check 가정)
    const individualTerms = document.querySelectorAll('.individual-term-check'); 
    
    // 선택된 시간 표시 (selected-time-display 요소가 존재할 경우에만)
    if (timeDisplay) {
        timeDisplay.textContent = selectedTime; 
    }

    // ----------------------------------------------------
    // 2-2. 핵심 로직: 필수 약관 동의 검사 함수
    // ----------------------------------------------------
    // 이 함수는 필수 약관 체크 상태를 확인하고, 다음 버튼을 활성화/비활성화합니다.
    const checkRequiredTerm = () => {
        // 필수 약관(requiredTerm)이 체크되었는지 확인
        const isRequiredChecked = requiredTerm.checked;

        // 최종적으로 다음 버튼 활성화 여부 결정
        nextStepBtn.disabled = !isRequiredChecked;
        
        // 추가: 모든 개별 약관이 체크되었는지 확인하여 '전체 동의' 체크박스 상태 업데이트
        const allChecked = Array.from(individualTerms).every(checkbox => checkbox.checked);
        termsAgree.checked = allChecked;
    };


    // ----------------------------------------------------
    // 2-3. 이벤트 리스너 설정
    // ----------------------------------------------------
    
    // 개별 약관 변경 시마다 검사 (필수든 선택이든 눌릴 때마다 버튼 상태 검사)
    individualTerms.forEach(checkbox => {
        checkbox.addEventListener('change', checkRequiredTerm);
    });

    // 전체 동의 체크박스 클릭 시 모든 개별 약관 토글 (편의성)
    termsAgree.addEventListener('change', () => {
        const checked = termsAgree.checked;
        
        // 1. 모든 개별 약관 체크박스 상태를 전체 동의 상태와 동일하게 설정
        individualTerms.forEach(checkbox => {
            checkbox.checked = checked; 
        });
        
        // 2. 다음 단계 버튼 상태 업데이트
        //    전체 동의가 체크되면 당연히 필수 약관도 체크되므로 버튼 활성화
        //    전체 동의가 해제되면 필수 약관도 해제되므로 버튼 비활성화
        nextStepBtn.disabled = !checked; 
    });

    // 다음 단계 버튼 클릭 이벤트
    nextStepBtn.addEventListener('click', () => {
        if (nextStepBtn.disabled) {
            alert('모든 필수 약관에 동의해야 다음 단계로 진행할 수 있습니다.');
            return;
        }

        const nextUrl = `./info.html?time=${selectedTime}&booth=${boothId}`;
        window.location.href = nextUrl;
    });

    // 페이지 로드 시 초기 상태 검사
    checkRequiredTerm();
});