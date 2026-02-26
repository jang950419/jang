const MODEL_URL = "https://teachablemachine.withgoogle.com/models/swB2a6pCH/";
let model, labelContainer, maxPredictions;
let isModelLoading = false;
let webcamStream = null;

// Load the image model
async function init() {
    if (model || isModelLoading) return;
    isModelLoading = true;
    
    try {
        const modelURL = MODEL_URL + "model.json";
        const metadataURL = MODEL_URL + "metadata.json";

        // load the model and metadata
        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();
        labelContainer = document.getElementById("label-container");
    } catch (e) {
        console.error("모델 로딩 실패:", e);
        alert("AI 모델을 불러오는 데 실패했습니다. 페이지를 새로고침 해주세요.");
    } finally {
        isModelLoading = false;
    }
}

async function predict(imageElement) {
    const target = imageElement || document.getElementById("face-image");
    try {
        const prediction = await model.predict(target);
        
        // Sort predictions by probability
        prediction.sort((a, b) => parseFloat(b.probability) - parseFloat(a.probability));

        const topResult = prediction[0].className;
        displayResult(topResult, prediction);
    } catch (e) {
        console.error("예측 오류:", e);
        alert("이미지 분석 중 오류가 발생했습니다.");
        document.getElementById("loading").classList.add("hidden");
    }
}

// 매핑 테이블: 모델 라벨(dog, cat, wolf, bear) -> 한글 메시지
const animalMessages = {
    "dog": {
        title: "천성이 사랑스러운 '인간 리트리버' 강아지상",
        message: "당신은 존재만으로 주변을 밝히는 인간 비타민이군요! 꼬리가 보일 것 같은 친화력으로 처음 보는 사람과도 금방 친구가 되는 '핵인싸' 타입입니다. 당신의 해맑은 미소에 안 넘어올 사람은 없겠네요!"
    },
    "cat": {
        title: "밀당의 고수! 치명적인 '츤데레' 고양이상",
        message: "도도하고 시크해 보이지만 사실은 은근히 관심을 즐기는 매력쟁이군요! 가끔 보여주는 엉뚱함과 다정한 반전 매력에 주변 사람들은 이미 당신의 포로가 되어있을 거예요. 알면 알수록 궁금해지는 신비로운 타입입니다."
    },
    "wolf": {
        title: "차도남/차도녀의 정석! 의리파 '고독한 늑대'상",
        message: "날카로운 눈빛과 지적인 분위기에 처음엔 다가가기 힘들지만, 알고 보면 자기 사람에겐 한없이 따뜻한 의리파군요! 한 번 정을 주면 끝까지 챙기는 듬직한 카리스마 덕분에 주변의 신뢰를 한 몸에 받는 타입입니다."
    },
    "bear": {
        title: "포근하고 듬직해서 자꾸 안기고 싶은 '곰돌이'상",
        message: "무뚝뚝해 보여도 사실은 누구보다 속이 깊고 섬세한 따뜻한 마음의 소유자군요! 느릿느릿해 보이는 여유로움 속에 주변을 편안하게 만드는 힐링 에너지가 가득합니다. 당신 곁에 있으면 다들 마음이 사르르 녹아버려요."
    }
};

const barClasses = {
    "dog": "dog-bar",
    "cat": "cat-bar",
    "wolf": "wolf-bar",
    "bear": "bear-bar"
};

const koreanLabels = {
    "dog": "강아지",
    "cat": "고양이",
    "wolf": "늑대",
    "bear": "곰"
};

function displayResult(topResult, predictions) {
    const result = animalMessages[topResult] || { title: "신비로운 동물상", message: "분석 결과가 나왔습니다!" };
    
    document.getElementById("result-title").innerText = result.title;
    document.getElementById("result-message").innerText = result.message;
    
    labelContainer.innerHTML = "";
    
    predictions.forEach(p => {
        const percent = (p.probability * 100).toFixed(0);
        if (percent < 1) return; // 1% 미만은 표시 안 함

        const barClass = barClasses[p.className] || "dog-bar";
        const label = koreanLabels[p.className] || p.className;
        
        const labelWrapper = document.createElement("div");
        labelWrapper.style.marginBottom = "15px";
        
        labelWrapper.innerHTML = `
            <div class="bar-label">
                <span>${label}</span>
                <span>${percent}%</span>
            </div>
            <div class="bar-container">
                <div class="bar ${barClass}" style="width: ${percent}%"></div>
            </div>
        `;
        labelContainer.appendChild(labelWrapper);
    });

    document.getElementById("loading").classList.add("hidden");
    document.getElementById("result-area").style.display = "block";
}

function handleImageUpload(event) {
    const input = event.target;
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.getElementById("face-image");
            img.src = e.target.result;
            img.style.display = "block";
            
            document.getElementById("upload-prompt").style.display = "none";
            document.getElementById("result-area").style.display = "none";
            document.getElementById("loading").classList.remove("hidden");
            
            // Allow image to load before prediction
            img.onload = async () => {
                if (!model) await init();
                await predict(img);
            };
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// Mode switching logic
async function switchMode(mode) {
    const uploadTab = document.getElementById('upload-tab');
    const webcamTab = document.getElementById('webcam-tab');
    const uploadContainer = document.getElementById('upload-container');
    const webcamContainer = document.getElementById('webcam-container');
    const resultArea = document.getElementById('result-area');
    
    // Hide results when switching
    resultArea.style.display = "none";
    
    if (mode === 'upload') {
        uploadTab.classList.add('active');
        webcamTab.classList.remove('active');
        uploadContainer.classList.remove('hidden');
        webcamContainer.classList.add('hidden');
        stopWebcam();
    } else {
        webcamTab.classList.add('active');
        uploadTab.classList.remove('active');
        webcamContainer.classList.remove('hidden');
        uploadContainer.classList.add('hidden');
        await startWebcam();
    }
}

async function startWebcam() {
    const video = document.getElementById('webcam-video');
    try {
        webcamStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "user" }, 
            audio: false 
        });
        video.srcObject = webcamStream;
    } catch (e) {
        console.error("웹캠 시작 실패:", e);
        alert("웹캠을 시작할 수 없습니다. 카메라 권한을 확인해주세요.");
        switchMode('upload');
    }
}

function stopWebcam() {
    if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
        webcamStream = null;
    }
}

async function captureImage() {
    const video = document.getElementById('webcam-video');
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const context = canvas.getContext('2d');
    // Mirror effect for capture to match video preview
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Show loading
    document.getElementById("loading").classList.remove("hidden");
    document.getElementById("webcam-container").classList.add("hidden");
    
    // Show captured image in the upload container (or a separate preview)
    const img = document.getElementById("face-image");
    img.src = canvas.toDataURL('image/png');
    img.style.display = "block";
    document.getElementById("upload-prompt").style.display = "none";
    document.getElementById("upload-container").classList.remove("hidden");
    
    stopWebcam();
    
    if (!model) await init();
    await predict(img);
}

// Initializing model loading when page starts
document.addEventListener('DOMContentLoaded', () => {
    init();
    
    // Theme toggle functionality (reusing from existing script)
    const themeToggleBtn = document.getElementById('theme-toggle');
    const body = document.body;
    
    if (themeToggleBtn) {
        if (localStorage.getItem('theme') === 'dark') {
            body.classList.add('dark-mode');
            const icon = themeToggleBtn.querySelector('i');
            if (icon) icon.classList.replace('fa-moon', 'fa-sun');
        }
        
        themeToggleBtn.addEventListener('click', () => {
            body.classList.toggle('dark-mode');
            const isDark = body.classList.contains('dark-mode');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            const icon = themeToggleBtn.querySelector('i');
            if (icon) {
                if (isDark) icon.classList.replace('fa-moon', 'fa-sun');
                else icon.classList.replace('fa-sun', 'fa-moon');
            }
        });
    }
});
