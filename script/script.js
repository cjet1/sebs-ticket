// 하단바 클릭 시 스타일 변경 등의 기능 추가 가능
const navItems = document.querySelectorAll('.nav-item');

navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        // 모든 항목에서 'active' 클래스 제거
        navItems.forEach(nav => nav.classList.remove('active'));
        // 클릭된 항목에 'active' 클래스 추가
        item.classList.add('active');
        
        // 실제 페이지 이동 코드는 여기에 작성됩니다. (e.preventDefault()는 페이지 이동을 막는 코드)
        // e.preventDefault(); 
        // console.log(`${item.querySelector('.label').textContent} 버튼 클릭됨`);
    });
});

console.log("모바일용 예약 사이트 스크립트가 로드되었습니다.");

