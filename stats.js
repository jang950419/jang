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
            // 차트 색상 업데이트를 위해 새로고침 혹은 차트 리로드 로직이 필요할 수 있음
            location.reload(); // 가장 간단한 방법
        });
    }

    // 데이터 가져오기 및 분석
    async function fetchAndAnalyze() {
        try {
            const response = await fetch('https://smok95.github.io/lotto/results/all.json');
            const data = await response.json();
            
            analyzeData(data);
            
            statsLoader.classList.add('hidden');
            statsContent.classList.remove('hidden');
        } catch (error) {
            console.error('Data fetch error:', error);
            statsLoader.innerHTML = '<p>데이터를 불러오는 데 실패했습니다. 잠시 후 다시 시도해주세요.</p>';
        }
    }

    function analyzeData(allData) {
        const rounds = Object.values(allData);
        const totalRounds = rounds.length;
        
        const counts = Array(46).fill(0);
        const bonusCounts = Array(46).fill(0);
        const rangeCounts = [0, 0, 0, 0, 0]; // 1-10, 11-20, 21-30, 31-40, 41-45
        let totalOdds = 0;
        let totalEvens = 0;

        rounds.forEach(round => {
            const nums = [round.drwtNo1, round.drwtNo2, round.drwtNo3, round.drwtNo4, round.drwtNo5, round.drwtNo6];
            const bonus = round.bnusNo;

            nums.forEach(n => {
                counts[n]++;
                // 구간 계산
                if (n <= 10) rangeCounts[0]++;
                else if (n <= 20) rangeCounts[1]++;
                else if (n <= 30) rangeCounts[2]++;
                else if (n <= 40) rangeCounts[3]++;
                else rangeCounts[4]++;

                // 홀짝 계산
                if (n % 2 === 0) totalEvens++;
                else totalOdds++;
            });
            bonusCounts[bonus]++;
        });

        // 요약 정보 업데이트
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
        lastUpdateEl.textContent = lastRound.drwNoDate || '최신';

        // 차트 1: 번호별 빈도 (Bar Chart)
        renderFrequencyChart(counts);

        // 차트 2: 구간별 비율 (Pie Chart)
        renderRangeChart(rangeCounts);

        // 차트 3: 홀짝 비율 (Doughnut Chart)
        renderOddEvenChart(totalOdds, totalEvens);

        // 테이블 업데이트
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
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true }
                }
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
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
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
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
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

        // 전체 횟수 내림차순 정렬
        sortedData.sort((a, b) => b.count - a.count);

        sortedData.forEach(item => {
            const row = document.createElement('tr');
            
            // 상태 뱃지 결정
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
