// script/login.js (Realtime Database 버전)

let database;
let firebaseConfig;

// 1. 폼 전환 함수 (동일)
function switchForm(mode) {
    document.getElementById('login-form').style.display = (mode === 'login' ? 'block' : 'none');
    document.getElementById('signup-form').style.display = (mode === 'signup' ? 'block' : 'none');
    document.getElementById('login-switch').style.display = (mode === 'login' ? 'block' : 'none');
    document.getElementById('signup-switch').style.display = (mode === 'signup' ? 'block' : 'none');
    document.getElementById('auth-status').textContent = '';
}

// 2. Firebase 설정 로드 및 초기화
fetch('/config.json')
    .then(response => response.json())
    .then(data => {
        firebaseConfig = data.firebaseConfig;
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        
        // 🚨 Realtime Database 인스턴스 사용
        database = firebase.database(); 
    })
    .catch(error => {
        console.error("Firebase 설정 파일 로드 오류:", error);
        document.getElementById('auth-status').textContent = '⚠️ 설정 파일 로드 오류';
    });


// 3. 회원가입 처리 함수 (Realtime Database에 저장)
async function handleSignup() {
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value; // 학번
    const name = document.getElementById('signup-name').value;
    const studentId = document.getElementById('signup-studentId').value;
    const authStatus = document.getElementById('auth-status');

    if (password.length < 4) {
        authStatus.textContent = '학번은 4자리 이상이어야 합니다.';
        return;
    }

    try {
        authStatus.textContent = '회원가입 처리 중...';

        // 1. 랜덤 예매번호 생성 (키 역할)
        const reserveId = 'RES-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        
        // 2. Realtime Database에 정보 저장
        // 예: /users/{reserveId} 형태로 저장
        await database.ref('users/' + reserveId).set({
            email: email,
            name: name,
            studentId: studentId,
            reserveId: reserveId,
            // 🚨 비밀번호(학번)를 평문으로 저장하면 보안상 위험합니다.
            // 이 예제에서는 단순화를 위해 평문으로 저장합니다.
            password: password 
        });
        
        authStatus.textContent = `✅ 회원가입 성공! 예매번호는 [${reserveId}] 입니다. 로그인하세요.`;
        alert(`회원가입이 완료되었습니다. 예매번호: ${reserveId}`);
        switchForm('login');

    } catch (error) {
        console.error("회원가입 실패:", error);
        authStatus.textContent = `회원가입 실패: ${error.message}`;
    }
}


// 4. 로그인 처리 함수 (Realtime Database에서 조회하여 인증)
async function handleLogin() {
    const reserveId = document.getElementById('reserve-id-input').value; // 예매번호
    const studentId = document.getElementById('password-input').value; // 학번 (비밀번호 역할)
    const authStatus = document.getElementById('auth-status');

    if (!reserveId || !studentId) {
        authStatus.textContent = '예매번호와 학번을 모두 입력해주세요.';
        return;
    }

    try {
        authStatus.textContent = '로그인 정보 확인 중...';

        // 1. Realtime Database에서 해당 예매번호를 가진 문서 조회
        const snapshot = await database.ref('users/' + reserveId).once('value');

        if (!snapshot.exists()) {
            authStatus.textContent = '예매번호가 존재하지 않습니다.';
            return;
        }

        const userData = snapshot.val();
        
        // 2. 학번(비밀번호) 일치 여부 확인
        if (userData.studentId === studentId) {
            // 🚨 성공적으로 인증되었습니다!
            
            // Realtime Database는 세션 관리 기능을 제공하지 않으므로, 
            // 로그인 상태를 브라우저의 localStorage에 저장해야 합니다.
            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('userReserveId', reserveId);
            
            // 3. 페이지 이동
            document.getElementById('auth-status').textContent = `✅ 로그인 성공! ${userData.name}님 환영합니다.`;
            setTimeout(() => {
                window.location.href = 'reserve.html'; 
            }, 1500);

        } else {
            authStatus.textContent = '학번이 일치하지 않습니다.';
        }

    } catch (error) {
        console.error("로그인 실패:", error);
        authStatus.textContent = `로그인 오류: ${error.message}`;
    }
}

// 5. 로그인 성공 후 페이지 이동 함수 (Realtime DB 버전에서는 직접 처리)
function redirectToReservePage(user) {
    // Realtime DB 버전에서는 이 함수를 사용하지 않습니다.
}

// 초기 폼 설정
window.onload = () => {
    switchForm('login');
};