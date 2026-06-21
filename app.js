let socket = null;
let socketEventsBound = false;

function getSocket() {
    if (socket || typeof io !== 'function') return socket;

    try {
        socket = io();
        bindSocketEvents(socket);
    } catch (error) {
        console.warn('[FLOW] Socket unavailable until portal/server is ready.', error);
        socket = null;
    }

    return socket;
}

function emitSocket(eventName, payload) {
    if (!socket) return;

    try {
        socket.emit(eventName, payload);
    } catch (error) {
        console.warn('[FLOW] Socket emit skipped.', eventName, error);
    }
}

// State management
let currentStage = 'welcome';
let currentQuestionIndex = 0;
let noClickCount = 0;
let loadingInProgress = false;

const questions = [
    "คุณต้องการดำเนินการต่อหรือไม่?",
    "คุณเชื่อใจระบบนี้หรือไม่?",
    "คุณคิดว่าระบบนี้สร้างขึ้นมาเพื่อคนพิเศษหรือเปล่า?",
    "คุณอยากรู้ไหม?",
    "คุณกำลังยิ้มอยู่ใช่ไหม?",
    "ยืนยันครั้งสุดท้าย?"
];

const emotionalResponses = [
    "ทำไมเลือก ไม่ ล่ะ?",
    "แน่ใจเหรอ?",
    "โปรดคิดอีกครั้งนะ",
    "ตั้งใจทำมากเลยนะอันนี้",
    "ยังจะ ไม่ อีกเหรอ?",
    "แบบนี้เสียใจนะ...",
    "จริงๆ เหรอ?",
    "โอกาสสุดท้ายแล้วนะ",
    "ตรวจพบความเสียหายทางอารมณ์ของระบบ",
    "คุณนี่ดื้อจริงๆ เลยนะ!"
];

const loadingTexts = [
    "กำลังเชื่อมต่อหัวใจ...",
    "กำลังเปิดจักรวาลความรัก...",
    "กำลังปรับจูนอารมณ์...",
    "กำลังเตรียมเซอร์ไพรส์..."
];

// Elements
const stages = {
    welcome: document.getElementById('stage-welcome'),
    questions: document.getElementById('stage-questions'),
    portal: document.getElementById('stage-portal'),
    universe: document.getElementById('stage-universe'),
    reveal: document.getElementById('stage-reveal')
};

const btnStart = document.getElementById('btn-start');
const btnYes = document.getElementById('btn-yes');
const btnNo = document.getElementById('btn-no');
const btnSend = document.getElementById('btn-send');
const btnTogglePwd = document.getElementById('btn-toggle-pwd');
const questionText = document.getElementById('question-text');
const emotionalResponseText = document.getElementById('emotional-response');
const inputName = document.getElementById('input-name');
const inputMessage = document.getElementById('input-message');
const terminalWindow = document.getElementById('terminal-window');
const revealText = document.getElementById('reveal-text');
const loadingOverlay = document.getElementById('loading-overlay');
const loadingTextEl = document.getElementById('loading-text');

// Init
function switchStage(stageName) {
    console.log(`[FLOW] Switching to stage: ${stageName}`);
    Object.keys(stages).forEach(key => {
        if (stages[key]) {
            stages[key].classList.add('hidden');
            stages[key].classList.remove('active');
        }
    });
    if (stages[stageName]) {
        stages[stageName].classList.remove('hidden');
        stages[stageName].classList.add('active');
    }
    currentStage = stageName;
    emitSocket('update_stage', stageName);
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function keepNoButtonInViewport() {
    if (!btnNo || currentStage !== 'questions' || btnNo.style.position !== 'fixed') return;

    const margin = 12;
    const btnWidth = btnNo.offsetWidth;
    const btnHeight = btnNo.offsetHeight;
    const maxX = Math.max(margin, window.innerWidth - btnWidth - margin);
    const maxY = Math.max(margin, window.innerHeight - btnHeight - margin);
    const x = Number.parseFloat(btnNo.style.left) || margin;
    const y = Number.parseFloat(btnNo.style.top) || margin;

    btnNo.style.left = `${clamp(x, margin, maxX)}px`;
    btnNo.style.top = `${clamp(y, margin, maxY)}px`;
}

// Password Toggle
if (btnTogglePwd && inputMessage) {
    btnTogglePwd.addEventListener('click', () => {
        const type = inputMessage.getAttribute('type') === 'password' ? 'text' : 'password';
        inputMessage.setAttribute('type', type);
        btnTogglePwd.innerText = type === 'password' ? '👁' : '🔒';
    });
}

// Floating Hearts Generator (Background)
function createHeart() {
    const container = document.getElementById('hearts-container');
    if (!container) return;
    const heart = document.createElement('div');
    heart.classList.add('heart');
    heart.innerHTML = '❤';
    heart.style.left = Math.random() * 100 + 'vw';
    heart.style.animationDuration = Math.random() * 2 + 3 + 's';
    container.appendChild(heart);
    setTimeout(() => heart.remove(), 6000);
}
setInterval(createHeart, 400);

// Stage 1: Welcome
if (btnStart) {
    btnStart.addEventListener('click', () => {
        switchStage('questions');
    });
}

// Stage 2: Questions
if (btnYes) {
    btnYes.addEventListener('click', () => {
        emitSocket('yes_selection', { question: questions[currentQuestionIndex] });
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            questionText.innerText = questions[currentQuestionIndex];
            emotionalResponseText.innerText = "";
        } else {
            switchStage('portal');
        }
    });
}

if (btnNo) {
    btnNo.addEventListener('click', () => {
        emitSocket('no_selection', { response: emotionalResponses[noClickCount] || "ไม่" });
        if (noClickCount < emotionalResponses.length) {
            emotionalResponseText.innerText = emotionalResponses[noClickCount];
        }
        
        // Animate button movement while keeping it visible on every viewport.
        const margin = 12;
        const btnWidth = btnNo.offsetWidth;
        const btnHeight = btnNo.offsetHeight;
        const maxX = Math.max(margin, window.innerWidth - btnWidth - margin);
        const maxY = Math.max(margin, window.innerHeight - btnHeight - margin);
        const randomX = clamp(Math.random() * maxX, margin, maxX);
        const randomY = clamp(Math.random() * maxY, margin, maxY);

        btnNo.style.position = 'fixed';
        btnNo.style.left = randomX + 'px';
        btnNo.style.top = randomY + 'px';
        btnNo.style.zIndex = "1000";

        noClickCount++;
    });
}

// Stage 3: Love Portal
if (btnSend) {
    btnSend.addEventListener('click', () => {
        const name = inputName.value.trim();
        const message = inputMessage.value.trim();
        
        if (name && message) {
            getSocket();
            emitSocket('user_join', { name });
            emitSocket('send_message', { name, message });
            
            const originalText = btnSend.innerText;
            btnSend.innerText = "ส่งแล้ว";
            btnSend.disabled = true;

            addTerminalLine('SYSTEM', 'ส่งรหัสลับเรียบร้อยแล้ว');
            addTerminalLine('SYSTEM', 'รอการอนุมัติจากผู้ดูแล...');
            
            setTimeout(() => {
                inputMessage.value = "";
                btnSend.innerText = originalText;
                btnSend.disabled = false;
            }, 1500);
        } else {
            alert("กรุณากรอกข้อมูลให้ครบถ้วน");
        }
    });
}
   // Stage 4: ThreeJS Cosmic Heart Universe (Exact implementation from code.html)
function startUniverse() {

   const music = document.getElementById('universeMusic');

   if (music) {
        music.volume = 0.7;

        if (music.paused) {
            music.play().catch(err => {
                console.log('[MUSIC]', err);
            });
        }
    }
    (function() {
      const container = document.getElementById('threejs-container-COSMIC_HEART_REVEAL');
      if (!container || container.children.length > 0) return;
      
      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;
      
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(60, width / height, 1, 10000);
      camera.position.set(0, 200, 500);
      camera.lookAt(0, 0, 0);

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ReinhardToneMapping;
      renderer.toneMappingExposure = 2.0;
      container.appendChild(renderer.domElement);

      const controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.6;
      controls.enableZoom = true;

      function createStarTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.4, 'rgba(0, 242, 255, 0.4)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
        return new THREE.CanvasTexture(canvas);
      }
      const starTexture = createStarTexture();

      function createPixelHeartTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(32, 45);
        ctx.bezierCurveTo(32, 45, 10, 35, 10, 20);
        ctx.bezierCurveTo(10, 5, 32, 5, 32, 20);
        ctx.bezierCurveTo(32, 5, 54, 5, 54, 20);
        ctx.bezierCurveTo(54, 35, 32, 45, 32, 45);
        ctx.fill();

        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff00ff';
        ctx.stroke();

        return new THREE.CanvasTexture(canvas);
      }
      const heartParticleTexture = createPixelHeartTexture();

      // --- MASSIVE SPIRAL GALAXY (100,000 Particles) ---
      const galaxyParams = {
        count: 100000,
        size: 1.5,
        branches: 5,
        spin: 1.5,
        randomness: 0.25,
        randomnessPower: 3,
        insideColor: '#ffffff',
        outsideColor: '#ff00ff'
      };

      const galaxyGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array(galaxyParams.count * 3);
      const colors = new Float32Array(galaxyParams.count * 3);
      const scales = new Float32Array(galaxyParams.count);

      const colorInside = new THREE.Color(galaxyParams.insideColor);
      const colorOutside = new THREE.Color(galaxyParams.outsideColor);

      for(let i = 0; i < galaxyParams.count; i++) {
        const i3 = i * 3;
        const radius = Math.random() * 450;
        const spinAngle = radius * galaxyParams.spin;
        const branchAngle = (i % galaxyParams.branches) / galaxyParams.branches * Math.PI * 2;

        const randomX = Math.pow(Math.random(), galaxyParams.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * galaxyParams.randomness * radius;
        const randomY = Math.pow(Math.random(), galaxyParams.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * galaxyParams.randomness * radius;
        const randomZ = Math.pow(Math.random(), galaxyParams.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * galaxyParams.randomness * radius;

        positions[i3] = Math.cos(branchAngle + spinAngle) * radius + randomX;
        positions[i3 + 1] = randomY - 60; 
        positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;

        const mixedColor = colorInside.clone();
        mixedColor.lerp(colorOutside, radius / 450);

        colors[i3] = mixedColor.r;
        colors[i3 + 1] = mixedColor.g;
        colors[i3 + 2] = mixedColor.b;
        
        scales[i] = Math.random();
      }

      galaxyGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      galaxyGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      
      const galaxyMaterial = new THREE.PointsMaterial({
        size: galaxyParams.size,
        sizeAttenuation: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
        transparent: true,
        opacity: 1.0,
        map: starTexture
      });
      const galaxy = new THREE.Points(galaxyGeometry, galaxyMaterial);
      scene.add(galaxy);

      // Core
      const coreGeo = new THREE.SphereGeometry(15, 32, 32);
      const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const core = new THREE.Mesh(coreGeo, coreMat);
      core.position.y = -60;
      scene.add(core);

      // --- CELESTIAL HEART ---
      const heartCount = 25000;
      const heartGeo = new THREE.BufferGeometry();
      const heartPos = new Float32Array(heartCount * 3);
      const heartCols = new Float32Array(heartCount * 3);

      for(let i = 0; i < heartCount; i++) {
        const i3 = i * 3;
        const t = Math.random() * Math.PI * 2;
        const r = Math.pow(Math.random(), 0.7);
        
        const x = 16 * Math.pow(Math.sin(t), 3) * r * 5.0;
        const y = (13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t)) * r * 5.0;
        const z = (Math.random() - 0.5) * 50 * (1 - Math.abs(y)/100);

        heartPos[i3] = x;
        heartPos[i3 + 1] = y + 50; 
        heartPos[i3 + 2] = z;

        const hColor = new THREE.Color(0xff4fd8);
        hColor.lerp(new THREE.Color(0xffffff), (1-r) * 0.8);
        heartCols[i3] = hColor.r;
        heartCols[i3 + 1] = hColor.g;
        heartCols[i3 + 2] = hColor.b;
      }

      heartGeo.setAttribute('position', new THREE.BufferAttribute(heartPos, 3));
      heartGeo.setAttribute('color', new THREE.BufferAttribute(heartCols, 3));
      const heartMat = new THREE.PointsMaterial({
        size: 2.8,
        map: starTexture,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: 1.0,
        vertexColors: true
      });
      const floatingHeart = new THREE.Points(heartGeo, heartMat);
      scene.add(floatingHeart);

      // --- THAI TEXT CONSTELLATION ---
      function createTextConstellation() {
        const text = "ผมรักคุณที่สุดในโลก";
        const textCanvas = document.createElement('canvas');
        const tCtx = textCanvas.getContext('2d');
        textCanvas.width = 1000;
        textCanvas.height = 200;
        
        tCtx.fillStyle = 'white';
        tCtx.font = 'bold 80px "Segoe UI", Tahoma, sans-serif';
        tCtx.textAlign = 'center';
        tCtx.textBaseline = 'middle';
        tCtx.fillText(text, 500, 100);

        const pixels = tCtx.getImageData(0, 0, 1000, 200).data;
        const textPoints = [];
        const step = 4;
        
        for(let y = 0; y < 200; y += step) {
          for(let x = 0; x < 1000; x += step) {
            const alpha = pixels[(y * 1000 + x) * 4 + 3];
            if(alpha > 128) {
              textPoints.push({
                x: (x - 500) * 1.5,
                y: (100 - y) * 1.5,
                z: (Math.random() - 0.5) * 10
              });
            }
          }
        }

        const textGeometry = new THREE.BufferGeometry();
        const textPositions = new Float32Array(textPoints.length * 3);
        const textColors = new Float32Array(textPoints.length * 3);

        const textColor1 = new THREE.Color(0xffffff);
        const textColor2 = new THREE.Color(0xffb6c1);

        for(let i = 0; i < textPoints.length; i++) {
          const i3 = i * 3;
          textPositions[i3] = textPoints[i].x;
          textPositions[i3 + 1] = textPoints[i].y;
          textPositions[i3 + 2] = textPoints[i].z;

          const mixedColor = textColor1.clone().lerp(textColor2, Math.random());
          textColors[i3] = mixedColor.r;
          textColors[i3 + 1] = mixedColor.g;
          textColors[i3 + 2] = mixedColor.b;
        }

        textGeometry.setAttribute('position', new THREE.BufferAttribute(textPositions, 3));
        textGeometry.setAttribute('color', new THREE.BufferAttribute(textColors, 3));

        const textMaterial = new THREE.PointsMaterial({
          size: 4,
          map: heartParticleTexture,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          vertexColors: true,
          opacity: 0.8
        });

        const textConstellation = new THREE.Points(textGeometry, textMaterial);
        textConstellation.position.set(0, -180, -400); 
        return textConstellation;
      }

      const textConstellation = createTextConstellation();
      scene.add(textConstellation);

      // Starfield
      const bgStarsGeo = new THREE.BufferGeometry();
      const bgStarsPos = new Float32Array(8000 * 3);
      for(let i = 0; i < 24000; i++) bgStarsPos[i] = (Math.random() - 0.5) * 6000;
      bgStarsGeo.setAttribute('position', new THREE.BufferAttribute(bgStarsPos, 3));
      const bgStarsMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.8, transparent: true, opacity: 0.5 });
      const starfield = new THREE.Points(bgStarsGeo, bgStarsMat);
      scene.add(starfield);

      const clock = new THREE.Clock();
      function animate() {
        requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();
        controls.update();

        galaxy.rotation.y = elapsedTime * 0.05;
        
        const floatY = 40 + Math.sin(elapsedTime * 0.6) * 15;
        floatingHeart.rotation.y = Math.sin(elapsedTime * 0.3) * 0.15;
        floatingHeart.position.y = floatY;

        textConstellation.position.y = -180 + Math.sin(elapsedTime * 0.5) * 10;
        textConstellation.rotation.y = Math.sin(elapsedTime * 0.2) * 0.1;
        textConstellation.material.opacity = 0.7 + Math.sin(elapsedTime * 2) * 0.2;
        
        core.scale.setScalar(1 + Math.sin(elapsedTime * 4) * 0.15);
        starfield.rotation.y = elapsedTime * 0.003;

        renderer.render(scene, camera);
      }

      window.addEventListener('resize', () => {
        const w = container.clientWidth || window.innerWidth;
        const h = container.clientHeight || window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      });
      animate();
    })();
}

// Loading Logic (Fixed 3s)
function startLoadingTransition() {
    if (loadingInProgress) return;
    loadingInProgress = true;
    loadingOverlay.classList.remove('hidden');
    let textIndex = 0;
    const interval = setInterval(() => {
        if (loadingTextEl) {
            loadingTextEl.innerText = loadingTexts[textIndex];
            textIndex = (textIndex + 1) % loadingTexts.length;
        }
    }, 800);

    setTimeout(() => {
        clearInterval(interval);
        loadingOverlay.classList.add('hidden');
        switchStage('universe');
        startUniverse();
        emitSocket('reveal_triggered');
    }, 3000); // EXACTLY 3 seconds
}

function addTerminalLine(type, content) {
    const line = document.createElement('div');
    line.classList.add('terminal-line');
    const prefix = type === 'SYSTEM' ? '[ระบบ]:' : '[ผู้ใช้]:';
    const className = type === 'SYSTEM' ? 'system' : 'user';
    line.innerHTML = `<span class="${className}">${prefix}</span> ${content}`;
    terminalWindow.appendChild(line);
    terminalWindow.scrollTop = terminalWindow.scrollHeight;
}

function bindSocketEvents(activeSocket) {
    if (socketEventsBound) return;
    socketEventsBound = true;

    activeSocket.on('terminal_response', (data) => {
        addTerminalLine(data.type, data.content);
    });

    // Stage 5: Admin Approval -> Approved Screen -> Loading -> Universe
    activeSocket.on('access_granted', () => {
        // Show Approved Screen first
        switchStage('reveal');

        // After 2 seconds of Approved Screen, show loading for 3 seconds, then Universe
        setTimeout(() => {
            startLoadingTransition();
        }, 2000);
    });

    activeSocket.on('access_rejected', (data) => {
        alert(data.message);
    });
}

window.addEventListener('resize', keepNoButtonInViewport);

function typeWriter(text, element, i = 0) {
    if (i === 0) element.innerHTML = '';
    if (i < text.length) {
        element.innerHTML += text.charAt(i) === '\n' ? '<br>' : text.charAt(i);
        setTimeout(() => typeWriter(text, element, i + 1), 50);
    }
}
