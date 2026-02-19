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
        if (excludeNumbers.length > 39) {
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

            let pool = Array.from({length: 45}, (_, k) => k + 1);
            pool = pool.filter(n => !excludeNumbers.includes(n));

            let currentNumbers = [];
            if (includeNumber) {
                currentNumbers.push(includeNumber);
                pool = pool.filter(n => n !== includeNumber);
            }

            while (currentNumbers.length < 6) {
                if (pool.length === 0) break;
                const randomIndex = Math.floor(Math.random() * pool.length);
                const num = pool[randomIndex];
                currentNumbers.push(num);
                pool.splice(randomIndex, 1);
            }

            currentNumbers.sort((a, b) => a - b);

            const bonusIndex = Math.floor(Math.random() * pool.length);
            const bonusNumber = pool[bonusIndex];

            currentNumbers.forEach(num => {
                row.appendChild(createBall(num));
            });

            const plusIcon = document.createElement('div');
            plusIcon.className = 'plus-icon';
            plusIcon.innerHTML = '<i class="fas fa-plus"></i>';
            row.appendChild(plusIcon);

            const bonusBall = createBall(bonusNumber);
            bonusBall.classList.add('bonus-ball');
            row.appendChild(bonusBall);

            resultArea.appendChild(row);
        }
    }

    if (generateBtn) generateBtn.addEventListener('click', generateLotto);

    // FAQ 토글 기능
    const faqItems = document.querySelectorAll('.faq-item .question');
    faqItems.forEach(item => {
        item.addEventListener('click', () => {
            const answer = item.nextElementSibling;
            answer.style.display = (answer.style.display === 'block') ? 'none' : 'block';
        });
    });

    // 제휴 문의 폼 토글
    const showContactBtn = document.getElementById('show-contact-btn');
    const contactFormWrapper = document.getElementById('contact-form-wrapper');

    if (showContactBtn && contactFormWrapper) {
        showContactBtn.addEventListener('click', () => {
            if (contactFormWrapper.classList.contains('hidden')) {
                contactFormWrapper.classList.remove('hidden');
                showContactBtn.innerHTML = '<i class="fas fa-times"></i> 닫기';
                showContactBtn.style.backgroundColor = 'var(--secondary-color)';
                contactFormWrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                contactFormWrapper.classList.add('hidden');
                showContactBtn.innerHTML = '<i class="fas fa-envelope"></i> 제휴 문의하기';
                showContactBtn.style.backgroundColor = 'var(--primary-color)';
            }
        });
    }

    // 테마 전환
    const themeToggleBtn = document.getElementById('theme-toggle');
    const body = document.body;
    const themeIcon = themeToggleBtn ? themeToggleBtn.querySelector('i') : null;

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
        if (themeIcon) {
            themeIcon.classList.replace('fa-moon', 'fa-sun');
        }
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            body.classList.toggle('dark-mode');
            const isDark = body.classList.contains('dark-mode');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            if (themeIcon) {
                if (isDark) themeIcon.classList.replace('fa-moon', 'fa-sun');
                else themeIcon.classList.replace('fa-sun', 'fa-moon');
            }
        });
    }
});
