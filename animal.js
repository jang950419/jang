const URL = "https://teachablemachine.withgoogle.com/models/swB2a6pCH/";
let model, labelContainer, maxPredictions;

// Load the image model
async function init() {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    // load the model and metadata
    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    labelContainer = document.getElementById("label-container");
}

async function predict() {
    const image = document.getElementById("face-image");
    const prediction = await model.predict(image);
    
    // Sort predictions by probability
    prediction.sort((a, b) => parseFloat(b.probability) - parseFloat(a.probability));

    const topResult = prediction[0].className;
    displayResult(topResult, prediction);
}

const animalMessages = {
    "강아지": {
        title: "귀엽고 다정한 강아지상",
        message: "당신은 보는 사람마저 기분 좋게 만드는 다정한 매력의 소유자군요! 꼬리를 흔들며 반겨주는 강아지처럼 주변 사람들에게 에너지를 주는 타입입니다."
    },
    "고양이": {
        title: "도도하고 매력적인 고양이상",
        message: "당신은 첫인상은 조금 차가워 보일 수 있지만, 알면 알수록 깊은 매력을 가진 분이시네요! 도도하면서도 가끔 보여주는 애교가 반전 매력 포인트입니다."
    },
    "늑대": {
        title: "강렬하고 카리스마 넘치는 늑대상",
        message: "당신은 리더십이 뛰어나고 강한 눈빛을 가진 카리스마 있는 분이군요! 차갑고 지적인 분위기 속에 따뜻한 의리를 품고 있는 멋진 사람입니다."
    },
    "곰": {
        title: "듬직하고 포근한 곰상",
        message: "당신은 보기만 해도 마음이 편안해지는 듬직한 매력을 가지셨네요! 푸근한 인상 속에 섬세하고 따뜻한 마음씨를 가진 당신은 누구에게나 신뢰받는 타입입니다."
    }
};

const barClasses = {
    "강아지": "dog-bar",
    "고양이": "cat-bar",
    "늑대": "wolf-bar",
    "곰": "bear-bar"
};

function displayResult(topResult, predictions) {
    const result = animalMessages[topResult] || { title: "신비로운 동물상", message: "분석 결과가 나왔습니다!" };
    
    document.getElementById("result-title").innerText = result.title;
    document.getElementById("result-message").innerText = result.message;
    
    labelContainer.innerHTML = "";
    
    predictions.forEach(p => {
        const percent = (p.probability * 100).toFixed(0);
        const barClass = barClasses[p.className] || "dog-bar";
        
        const labelWrapper = document.createElement("div");
        labelWrapper.style.marginBottom = "15px";
        
        labelWrapper.innerHTML = `
            <div class="bar-label">
                <span>${p.className}</span>
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
            document.getElementById("loading").classList.remove("hidden");
            
            // Allow image to load before prediction
            img.onload = async () => {
                if (!model) await init();
                await predict();
            };
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// Initializing model loading when page starts
document.addEventListener('DOMContentLoaded', () => {
    init();
    
    // Theme toggle functionality (reusing from existing script)
    const themeToggleBtn = document.getElementById('theme-toggle');
    const body = document.body;
    
    if (localStorage.getItem('theme') === 'dark') {
        body.classList.add('dark-mode');
        themeToggleBtn.querySelector('i').classList.replace('fa-moon', 'fa-sun');
    }
    
    themeToggleBtn.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        const isDark = body.classList.contains('dark-mode');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        const icon = themeToggleBtn.querySelector('i');
        if (isDark) icon.classList.replace('fa-moon', 'fa-sun');
        else icon.classList.replace('fa-sun', 'fa-moon');
    });
});
