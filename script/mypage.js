// script/mypage.js

let firestore; // Firestore 객체
let currentUser; // 현재 사용자 객체

// 1. Firebase 설정 로드 및 초기화 (즉시 실행 함수로 변경)
(async () => {
    try {
        const response = await fetch('/config.json');
        const data = await response.json();

        if (!firebase.apps.length) {
            firebase.initializeApp(data.firebaseConfig);
        }

        // 전역 변수 초기화는 그대로 유지
        firestore = firebase.firestore();
        
        // 2. 인증 상태 변화 감지 리스너
        firebase.auth().onAuthStateChanged(user => {
            currentUser = user;
            updateMyPageUI(user);
        });

    } catch (error) {
        console.error("Firebase 설정 로드 또는 초기화 오류:", error);
    }
})();


// 3. UI 업데이트 함수
function updateMyPageUI(user) {
    const displayEmail = document.getElementById('display-email');
    const logoutButton = document.getElementById('logout-button');
    const mainMenu = document.getElementById('main-menu');
    const loginRequired = document.getElementById('login-required');

    if (user) {
        // 📢 로그인 상태일 때
        mainMenu.style.display = 'block';
        loginRequired.style.display = 'none';
        logoutButton.style.display = 'inline-block';
        logoutButton.onclick = handleLogout;

        // 📢 Firestore에서 사용자 이름/학번 정보 가져오기 (이름을 표시하기 위함)
        firestore.collection('users').doc(user.uid).get()
            .then(doc => {
                if (doc.exists && doc.data().name) {
                    displayEmail.textContent = `${doc.data().name}님 (${user.email || user.uid.substring(0, 8)})`;
                } else {
                    displayEmail.textContent = user.email || '로그인 완료';
                }
            })
            .catch(error => {
                console.error("Firestore 정보 로드 실패:", error);
                displayEmail.textContent = user.email || '로그인 완료';
            });
            
    } else {
        // 📢 로그아웃 상태일 때
        displayEmail.textContent = '로그인이 필요합니다.';
        logoutButton.style.display = 'none';
        mainMenu.style.display = 'none';
        loginRequired.style.display = 'block';
    }
}

// 4. 로그아웃 처리 함수
function handleLogout() {
    firebase.auth().signOut()
        .then(() => {
            alert('로그아웃 되었습니다.');
            // 로그아웃 후 로그인 페이지나 홈 페이지로 리디렉션
            window.location.href = 'reserve.html'; 
        })
        .catch(error => {
            console.error("로그아웃 오류:", error);
            alert('로그아웃 중 오류가 발생했습니다.');
        });
}