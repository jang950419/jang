document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.getElementById('generate-btn');
    const resultArea = document.getElementById('result-area');
    const excludeInput = document.getElementById('exclude-numbers');
    const includeInput = document.getElementById('include-number');
    const gameCountSelect = document.getElementById('game-count');
    
    const secondaryActions = document.getElementById('secondary-actions');
    const saveBtn = document.getElementById('save-btn');
    const downloadBtn = document.getElementById('download-btn');
    const kakaoShareBtn = document.getElementById('kakao-share-btn');
    
    const savedNumbersContainer = document.getElementById('saved-numbers-container');
    const savedList = document.getElementById('saved-list');
    const clearSavedBtn = document.getElementById('clear-saved-btn');

    let lastGeneratedGames = []; // 공유 및 저장을 위한 데이터 저장

    // 카카오 SDK 초기화
    function initKakao() {
        if (typeof Kakao !== 'undefined' && !Kakao.isInitialized()) {
            Kakao.init('e1c0999230ec9df7cc9114c77d481bb5'); 
        }
    }
    initKakao();

    // 번호 색상 결정 함수
    function getColorClass(num) {
        if (num <= 10) return 'yellow';
        if (num <= 20) return 'blue';
        if (num <= 30) return 'red';
        if (num <= 40) return 'gray';
        return 'green';
    }

    // 로또 공 생성 함수
    function createBall(num, small = false) {
        const ball = document.createElement('div');
        ball.className = small ? `saved-ball ${getColorClass(num)}` : `ball ${getColorClass(num)}`;
        ball.textContent = num;
        return ball;
    }

    // 메인 로직: 번호 생성
    function generateLotto() {
        const gameCount = parseInt(gameCountSelect.value);
        const excludeStr = excludeInput.value.trim();
        const includeStr = includeInput.value.trim();

        let excludeNumbers = [];
        if (excludeStr) {
            excludeNumbers = excludeStr.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
        }

        let includeNumber = null;
        if (includeStr) {
            includeNumber = parseInt(includeStr);
            if (isNaN(includeNumber) || includeNumber < 1 || includeNumber > 45) {
                alert('포함할 번호는 1~45 사이의 숫자여야 합니다.');
                return;
            }
        }

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

        resultArea.innerHTML = '';
        lastGeneratedGames = [];

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
            lastGeneratedGames.push({ main: currentNumbers, bonus: bonusNumber });
        }

        secondaryActions.classList.remove('hidden');
    }

    if (generateBtn) generateBtn.addEventListener('click', generateLotto);

    // 기능 1: 저장하기
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            if (lastGeneratedGames.length === 0) return;
            
            let saved = JSON.parse(localStorage.getItem('savedLotto') || '[]');
            // 최신 생성된 게임들을 저장 목록 맨 앞에 추가
            saved = [...lastGeneratedGames, ...saved].slice(0, 20); // 최대 20개만 유지
            localStorage.setItem('savedLotto', JSON.stringify(saved));
            
            renderSavedNumbers();
            alert('번호가 저장되었습니다. 하단에서 확인할 수 있습니다.');
        });
    }

    // 기능 2: 이미지 다운로드
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            if (lastGeneratedGames.length === 0) return;
            
            html2canvas(resultArea, {
                backgroundColor: getComputedStyle(document.body).getPropertyValue('--container-bg'),
                scale: 2
            }).then(canvas => {
                const link = document.createElement('a');
                link.download = `lotto-master-${new Date().getTime()}.png`;
                link.href = canvas.toDataURL();
                link.click();
            });
        });
    }

    // 기능 3: 카카오톡 공유
    if (kakaoShareBtn) {
        kakaoShareBtn.addEventListener('click', () => {
            if (lastGeneratedGames.length === 0) return;

            const firstGame = lastGeneratedGames[0];
            const mainNums = firstGame.main.join(', ');
            const bonusNum = firstGame.bonus;

            Kakao.Share.sendDefault({
                objectType: 'feed',
                content: {
                    title: '🍀 이번 주 행운의 로또 번호',
                    description: `추천 번호: ${mainNums}\n보너스 번호: ${bonusNum}`,
                    imageUrl: 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?q=80&w=1000&auto=format&fit=crop',
                    link: {
                        mobileWebUrl: 'https://jang950419.github.io/jnag/',
                        webUrl: 'https://jang950419.github.io/jnag/',
                    },
                },
                social: {
                    likeCount: 777,
                    sharedCount: 888,
                },
                buttons: [
                    {
                        title: '행운의 번호 생성하러 가기',
                        link: {
                            mobileWebUrl: 'https://jang950419.github.io/jnag/',
                            webUrl: 'https://jang950419.github.io/jnag/',
                        },
                    }
                ],
            });
        });
    }

    // 저장된 번호 렌더링
    function renderSavedNumbers() {
        const saved = JSON.parse(localStorage.getItem('savedLotto') || '[]');
        if (saved.length === 0) {
            savedNumbersContainer.classList.add('hidden');
            return;
        }

        savedNumbersContainer.classList.remove('hidden');
        savedList.innerHTML = '';

        saved.forEach((game, index) => {
            const item = document.createElement('div');
            item.className = 'saved-item';
            
            const numsDiv = document.createElement('div');
            numsDiv.className = 'saved-nums';
            
            game.main.forEach(n => numsDiv.appendChild(createBall(n, true)));
            
            const plus = document.createElement('span');
            plus.style.margin = '0 5px';
            plus.innerHTML = '<i class="fas fa-plus" style="font-size:0.7rem; opacity:0.5;"></i>';
            numsDiv.appendChild(plus);
            
            numsDiv.appendChild(createBall(game.bonus, true));

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-item-btn';
            deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
            deleteBtn.onclick = () => deleteSavedItem(index);

            item.appendChild(numsDiv);
            item.appendChild(deleteBtn);
            savedList.appendChild(item);
        });
    }

    function deleteSavedItem(index) {
        let saved = JSON.parse(localStorage.getItem('savedLotto') || '[]');
        saved.splice(index, 1);
        localStorage.setItem('savedLotto', JSON.stringify(saved));
        renderSavedNumbers();
    }

    if (clearSavedBtn) {
        clearSavedBtn.addEventListener('click', () => {
            if (confirm('모든 저장된 번호를 삭제하시겠습니까?')) {
                localStorage.removeItem('savedLotto');
                renderSavedNumbers();
            }
        });
    }

    // 초기 로드 시 저장된 번호 표시
    renderSavedNumbers();

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
