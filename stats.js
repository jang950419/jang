document.addEventListener('DOMContentLoaded', () => {
    const statsLoader = document.getElementById('stats-loader');
    const statsContent = document.getElementById('stats-content');
    const totalRoundsEl = document.getElementById('total-rounds');
    const topNumberEl = document.getElementById('top-number');
    const lastUpdateEl = document.getElementById('last-update');
    const tableBody = document.getElementById('frequency-table-body');

    // 테마 토글 버튼 연동
    const themeToggleBtn = document.getElementById('theme-toggle');
    const body = document.body;
    const themeIcon = themeToggleBtn ? themeToggleBtn.querySelector('i') : null;

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
        if (themeIcon) themeIcon.classList.replace('fa-moon', 'fa-sun');
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
            location.reload(); 
        });
    }

    // 데이터 가져오기 및 분석
    async function fetchAndAnalyze() {
        // 여러 데이터 소스를 시도하여 안정성 확보
        const sources = [
            'https://smok95.github.io/lotto/results/all.json',
            'https://raw.githubusercontent.com/smok95/lotto/master/results/all.json'
        ];

        let data = null;
        let fetchError = null;

        for (const url of sources) {
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error('Network response was not ok');
                data = await response.json();
                if (data) break; // 성공하면 루프 탈출
            } catch (error) {
                console.warn(`Failed to fetch from ${url}:`, error);
                fetchError = error;
            }
        }

        if (data) {
            try {
                analyzeData(data);
                statsLoader.classList.add('hidden');
                statsContent.classList.remove('hidden');
            } catch (err) {
                console.error('Data analysis error:', err);
                showError('데이터 분석 중 오류가 발생했습니다.');
            }
        } else {
            showError('데이터를 불러올 수 없습니다. 네트워크 연결을 확인해주세요.');
        }
    }

    function showError(msg) {
        statsLoader.innerHTML = `
            <div style="color: var(--secondary-color); padding: 20px;">
                <i class="fas fa-exclamation-circle" style="font-size: 3rem; margin-bottom: 15px;"></i>
                <p>${msg}</p>
                <button onclick="location.reload()" class="action-btn save-btn" style="margin-top: 20px; display: inline-flex;">다시 시도</button>
            </div>
        `;
    }

    function analyzeData(allData) {
        // 객체 형태 또는 배열 형태 모두 대응
        const rounds = Array.isArray(allData) ? allData : Object.values(allData);
        if (rounds.length === 0) throw new Error('No data found');

        const totalRounds = rounds.length;
        const counts = Array(46).fill(0);
        const bonusCounts = Array(46).fill(0);
        const rangeCounts = [0, 0, 0, 0, 0];
        let totalOdds = 0;
        let totalEvens = 0;

        rounds.forEach(round => {
            // 필드명이 다를 경우를 대비한 유연한 추출
            const n1 = round.drwtNo1 || round.no1;
            const n2 = round.drwtNo2 || round.no2;
            const n3 = round.drwtNo3 || round.no3;
            const n4 = round.drwtNo4 || round.no4;
            const n5 = round.drwtNo5 || round.no5;
            const n6 = round.drwtNo6 || round.no6;
            const bn = round.bnusNo || round.bonus;

            const nums = [n1, n2, n3, n4, n5, n6].filter(n => n !== undefined);
            
            nums.forEach(n => {
                counts[n]++;
                if (n <= 10) rangeCounts[0]++;
                else if (n <= 20) rangeCounts[1]++;
                else if (n <= 30) rangeCounts[2]++;
                else if (n <= 40) rangeCounts[3]++;
                else rangeCounts[4]++;

                if (n % 2 === 0) totalEvens++;
                else totalOdds++;
            });
            if (bn) bonusCounts[bn]++;
        });

        totalRoundsEl.textContent = `${totalRounds}회`;
        
        let maxFreq = 0;
        let topNum = 0;
        counts.forEach((c, idx) => {
            if (c > maxFreq) {
                maxFreq = c;
                topNum = idx;
            }
        });
        topNumberEl.textContent = `${topNum}번 (${maxFreq}회)`;
        
        const lastRound = rounds[rounds.length - 1];
        lastUpdateEl.textContent = lastRound.drwNoDate || lastRound.date || '최신';

        renderFrequencyChart(counts);
        renderRangeChart(rangeCounts);
        renderOddEvenChart(totalOdds, totalEvens);
        renderTable(counts, bonusCounts);
    }

    function renderFrequencyChart(counts) {
        const ctx = document.getElementById('frequencyChart').getContext('2d');
        const labels = Array.from({length: 45}, (_, i) => i + 1);
        const data = counts.slice(1);

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: '출현 횟수',
                    data: data,
                    backgroundColor: labels.map(n => {
                        if (n <= 10) return '#ffd700';
                        if (n <= 20) return '#60a5fa';
                        if (n <= 30) return '#f87171';
                        if (n <= 40) return '#94a3b8';
                        return '#4ade80';
                    }),
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } }
            }
        });
    }

    function renderRangeChart(rangeCounts) {
        const ctx = document.getElementById('rangeChart').getContext('2d');
        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['1-10', '11-20', '21-30', '31-40', '41-45'],
                datasets: [{
                    data: rangeCounts,
                    backgroundColor: ['#ffd700', '#60a5fa', '#f87171', '#94a3b8', '#4ade80']
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    function renderOddEvenChart(odds, evens) {
        const ctx = document.getElementById('oddEvenChart').getContext('2d');
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['홀수', '짝수'],
                datasets: [{
                    data: [odds, evens],
                    backgroundColor: ['#f43f5e', '#3b82f6']
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    function renderTable(counts, bonusCounts) {
        const sortedData = [];
        for (let i = 1; i <= 45; i++) {
            sortedData.push({
                num: i,
                count: counts[i],
                bonus: bonusCounts[i],
                total: counts[i] + bonusCounts[i]
            });
        }

        sortedData.sort((a, b) => b.count - a.count);

        tableBody.innerHTML = '';
        sortedData.forEach(item => {
            const row = document.createElement('tr');
            let statusBadge = '';
            if (item.count > 165) statusBadge = '<span class="status hot">HOT</span>';
            else if (item.count < 140) statusBadge = '<span class="status cold">COLD</span>';
            else statusBadge = '<span class="status normal">평범</span>';

            row.innerHTML = `
                <td><span class="ball-sm ${getColorClass(item.num)}">${item.num}</span></td>
                <td><strong>${item.count}회</strong></td>
                <td>${item.bonus}회</td>
                <td>${statusBadge}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    function getColorClass(num) {
        if (num <= 10) return 'yellow';
        if (num <= 20) return 'blue';
        if (num <= 30) return 'red';
        if (num <= 40) return 'gray';
        return 'green';
    }

    fetchAndAnalyze();
});
