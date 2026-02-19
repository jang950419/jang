document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.getElementById('generate-btn');
    const resultArea = document.getElementById('result-area');
    const excludeInput = document.getElementById('exclude-numbers');
    const includeInput = document.getElementById('include-number');
    const gameCountSelect = document.getElementById('game-count');

    // 번호 색상 결정 함수
    function getColorClass(num) {
        if (num <= 10) return 'yellow';
        if (num <= 20) return 'blue';
        if (num <= 30) return 'red';
        if (num <= 40) return 'gray';
        return 'green';
    }

    // 로또 공 생성 함수
    function createBall(num) {
        const ball = document.createElement('div');
        ball.className = `ball ${getColorClass(num)}`;
        ball.textContent = num;
        return ball;
    }

    // 메인 로직
    function generateLotto() {
        const gameCount = parseInt(gameCountSelect.value);
        const excludeStr = excludeInput.value.trim();
        const includeStr = includeInput.value.trim();

        // 1. 제외수 파싱 및 검증
        let excludeNumbers = [];
        if (excludeStr) {
            excludeNumbers = excludeStr.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
        }

        // 2. 포함수 파싱 및 검증
        let includeNumber = null;
        if (includeStr) {
            includeNumber = parseInt(includeStr);
            if (isNaN(includeNumber) || includeNumber < 1 || includeNumber > 45) {
                alert('포함할 번호는 1~45 사이의 숫자여야 합니다.');
                return;
            }
        }

        // 유효성 검사
        if (excludeNumbers.some(n => n < 1 || n > 45)) {
            alert('제외할 번호는 1~45 사이의 숫자여야 합니다.');
            return;
        }
        if (excludeNumbers.length > 39) { // 최소 6개는 남아야 함
            alert('제외할 번호가 너무 많습니다.');
            return;
        }
        if (includeNumber && excludeNumbers.includes(includeNumber)) {
            alert('포함할 번호와 제외할 번호가 겹칩니다.');
            return;
        }

        // 결과 영역 초기화
        resultArea.innerHTML = '';

        // 게임 수만큼 반복 생성
        for (let i = 0; i < gameCount; i++) {
            const row = document.createElement('div');
            row.className = 'lotto-row';

            // 1~45 풀 생성
            let pool = Array.from({length: 45}, (_, k) => k + 1);

            // 제외수 제거
            pool = pool.filter(n => !excludeNumbers.includes(n));

            // 포함수 처리 (이미 있다면 풀에서 제거하고 결과 배열에 추가)
            let currentNumbers = [];
            if (includeNumber) {
                currentNumbers.push(includeNumber);
                pool = pool.filter(n => n !== includeNumber);
            }

            // 나머지 번호 랜덤 추출
            while (currentNumbers.length < 6) {
                if (pool.length === 0) break; // 안전장치
                const randomIndex = Math.floor(Math.random() * pool.length);
                const num = pool[randomIndex];
                currentNumbers.push(num);
                pool.splice(randomIndex, 1); // 뽑은 번호 제거
            }

            // 정렬
            currentNumbers.sort((a, b) => a - b);

            // 화면 표시
            currentNumbers.forEach(num => {
                row.appendChild(createBall(num));
            });

            resultArea.appendChild(row);
        }
    }

    generateBtn.addEventListener('click', generateLotto);

    // FAQ 토글 기능
    const faqItems = document.querySelectorAll('.faq-item .question');
    faqItems.forEach(item => {
        item.addEventListener('click', () => {
            const answer = item.nextElementSibling;
            if (answer.style.display === 'block') {
                answer.style.display = 'none';
            } else {
                answer.style.display = 'block';
            }
        });
    });
});
