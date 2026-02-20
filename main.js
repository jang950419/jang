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

    const modeTabs = document.querySelectorAll('.mode-tab');
    const modeDescription = document.getElementById('mode-description');

    let currentMode = 'lotto'; // 'lotto' or 'powerball'
    let lastGeneratedGames = [];

    // 모드 설정 값
    const modeConfigs = {
        lotto: {
            maxMain: 45,
            mainCount: 6,
            hasSpecial: true,
            specialRange: 45,
            specialLabel: '보너스',
            description: '1~45 중 6개 + 보너스 번호를 추출합니다.'
        },
        powerball: {
            maxMain: 69,
            mainCount: 5,
            hasSpecial: true,
            specialRange: 26,
            specialLabel: '파워볼',
            description: '1~69 중 5개 + 1~26 중 파워볼 1개를 추출합니다.'
        }
    };

    // 모드 전환 이벤트
    modeTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            modeTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentMode = tab.dataset.mode;
            updateModeUI();
        });
    });

    function updateModeUI() {
        const config = modeConfigs[currentMode];
        modeDescription.textContent = config.description;
        includeInput.max = config.maxMain;
        includeInput.placeholder = `예: ${Math.floor(config.maxMain / 2)}`;
        excludeInput.placeholder = `예: 1, 15 (1~${config.maxMain})`;
        resultArea.innerHTML = `
            <div class="placeholder-text">
                <i class="fas fa-dice" style="font-size: 2rem; margin-bottom: 10px;"></i><br>
                '${config.specialLabel}' 기반 번호 생성하기를 눌러보세요.
            </div>
        `;
        secondaryActions.classList.add('hidden');
    }

    // 카카오 SDK 초기화
    function initKakao() {
        if (typeof Kakao !== 'undefined' && !Kakao.isInitialized()) {
            Kakao.init('e1c0999230ec9df7cc9114c77d481bb5'); 
        }
    }
    initKakao();

    // 번호 색상 결정 함수
    function getColorClass(num, isSpecial = false) {
        if (currentMode === 'powerball') {
            return isSpecial ? 'powerball-special' : 'powerball-main';
        }
        // 기존 로또 색상
        if (num <= 10) return 'yellow';
        if (num <= 20) return 'blue';
        if (num <= 30) return 'red';
        if (num <= 40) return 'gray';
        return 'green';
    }

    // 공 생성 함수
    function createBall(num, isSpecial = false, small = false) {
        const ball = document.createElement('div');
        const colorClass = getColorClass(num, isSpecial);
        ball.className = small ? `saved-ball ${colorClass}` : `ball ${colorClass}`;
        if (isSpecial && !small) ball.classList.add('bonus-ball');
        ball.textContent = num;
        return ball;
    }

    // 메인 로직: 번호 생성
    function generateNumbers() {
        const config = modeConfigs[currentMode];
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
            if (isNaN(includeNumber) || includeNumber < 1 || includeNumber > config.maxMain) {
                alert(`포함할 번호는 1~${config.maxMain} 사이의 숫자여야 합니다.`);
                return;
            }
        }

        if (excludeNumbers.some(n => n < 1 || n > config.maxMain)) {
            alert(`제외할 번호는 1~${config.maxMain} 사이의 숫자여야 합니다.`);
            return;
        }

        resultArea.innerHTML = '';
        lastGeneratedGames = [];

        for (let i = 0; i < gameCount; i++) {
            const row = document.createElement('div');
            row.className = 'lotto-row';

            let pool = Array.from({length: config.maxMain}, (_, k) => k + 1);
            pool = pool.filter(n => !excludeNumbers.includes(n));

            let currentNumbers = [];
            if (includeNumber) {
                currentNumbers.push(includeNumber);
                pool = pool.filter(n => n !== includeNumber);
            }

            // 메인 번호 추출
            while (currentNumbers.length < config.mainCount) {
                const randomIndex = Math.floor(Math.random() * pool.length);
                const num = pool[randomIndex];
                currentNumbers.push(num);
                pool.splice(randomIndex, 1);
            }

            currentNumbers.sort((a, b) => a - b);

            // 특별 번호(보너스/파워볼) 추출
            let specialNumber;
            if (currentMode === 'lotto') {
                const bonusIndex = Math.floor(Math.random() * pool.length);
                specialNumber = pool[bonusIndex];
            } else {
                // 파워볼은 별도의 풀(1~26)에서 추출
                specialNumber = Math.floor(Math.random() * config.specialRange) + 1;
            }

            currentNumbers.forEach(num => {
                row.appendChild(createBall(num, false));
            });

            const plusIcon = document.createElement('div');
            plusIcon.className = 'plus-icon';
            plusIcon.innerHTML = '<i class="fas fa-plus"></i>';
            row.appendChild(plusIcon);

            row.appendChild(createBall(specialNumber, true));

            resultArea.appendChild(row);
            lastGeneratedGames.push({ 
                mode: currentMode,
                main: currentNumbers, 
                bonus: specialNumber 
            });
        }

        secondaryActions.classList.remove('hidden');
    }

    if (generateBtn) generateBtn.addEventListener('click', generateNumbers);

    // 기능 1: 저장하기
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            if (lastGeneratedGames.length === 0) return;
            
            let saved = JSON.parse(localStorage.getItem('savedLotto') || '[]');
            saved = [...lastGeneratedGames, ...saved].slice(0, 20);
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
                link.download = `${currentMode}-master-${new Date().getTime()}.png`;
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
            const modeName = firstGame.mode === 'lotto' ? '로또 6/45' : '파워볼';
            const mainNums = firstGame.main.join(', ');
            const bonusLabel = firstGame.mode === 'lotto' ? '보너스' : '파워볼';

            Kakao.Share.sendDefault({
                objectType: 'feed',
                content: {
                    title: `🍀 이번 주 행운의 ${modeName} 번호`,
                    description: `추천 번호: ${mainNums}\n${bonusLabel}: ${firstGame.bonus}`,
                    imageUrl: 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?q=80&w=1000&auto=format&fit=crop',
                    link: {
                        mobileWebUrl: window.location.href.split('?')[0].split('#')[0],
                        webUrl: window.location.href.split('?')[0].split('#')[0],
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
                            mobileWebUrl: window.location.href.split('?')[0].split('#')[0],
                            webUrl: window.location.href.split('?')[0].split('#')[0],
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
            savedList.innerHTML = '';
            return;
        }

        savedNumbersContainer.classList.remove('hidden');
        savedList.innerHTML = '';

        saved.forEach((game, index) => {
            const item = document.createElement('div');
            item.className = 'saved-item';
            
            const numsDiv = document.createElement('div');
            numsDiv.className = 'saved-nums';
            
            // 저장된 게임의 모드를 일시적으로 변경하여 올바른 색상 적용
            const prevMode = currentMode;
            currentMode = game.mode || 'lotto'; 

            game.main.forEach(n => numsDiv.appendChild(createBall(n, false, true)));
            
            const plus = document.createElement('span');
            plus.style.margin = '0 5px';
            plus.innerHTML = '<i class="fas fa-plus" style="font-size:0.7rem; opacity:0.5;"></i>';
            numsDiv.appendChild(plus);
            
            numsDiv.appendChild(createBall(game.bonus, true, true));

            currentMode = prevMode; // 모드 복구

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
