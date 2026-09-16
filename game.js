// Global Game State
let scene, camera, renderer, bus, wipers = [], door;
let speed = 0, rpm = 800, gear = 0;
let isEngineOn = false, isClutchPressed = false, isDoorOpen = false;
let wiperMode = 0; // 0: Off, 1: Slow, 2: Fast
let indicatorLeft = false, indicatorRight = false, hazardLight = false, headlight = false;

// Initialize 3D Graphics Engine
function initEngine() {
    const container = document.getElementById('game-canvas');

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    scene.fog = new THREE.FogExp2(0x0f172a, 0.008);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(6, 4, 10);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Lights
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    sunLight.position.set(20, 50, 20);
    sunLight.castShadow = true;
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Create HD Environment & Bus
    createEnvironment();
    createHDUPSRTCBus();

    // Controls
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    setupUIEvents();
    window.addEventListener('resize', onWindowResize);
    animate();
}

// Build Road & Surroundings
function createEnvironment() {
    const roadGeo = new THREE.PlaneGeometry(30, 1000);
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    scene.add(road);

    // Divider Line
    const lineGeo = new THREE.PlaneGeometry(0.6, 1000);
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const line = new THREE.Mesh(lineGeo, lineMat);
    line.rotation.x = -Math.PI / 2;
    line.position.y = 0.01;
    scene.add(line);
}

// HD UP State Saffron Bus Model Construction
function createHDUPSRTCBus() {
    bus = new THREE.Group();

    // Main Saffron Body (12m Scale)
    const bodyGeo = new THREE.BoxGeometry(2.6, 2.4, 11.5);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xff5500, roughness: 0.3 }); // Saffron Orange
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.8;
    bus.add(body);

    // White Center Stripe
    const stripeGeo = new THREE.BoxGeometry(2.62, 0.6, 11.52);
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.position.y = 1.7;
    bus.add(stripe);

    // Green Arrow Graphic
    const arrowGeo = new THREE.BoxGeometry(2.64, 0.4, 2.5);
    const arrowMat = new THREE.MeshStandardMaterial({ color: 0x16a34a });
    const arrow = new THREE.Mesh(arrowGeo, arrowMat);
    arrow.position.set(0, 1.7, 1);
    bus.add(arrow);

    // Front Windshield Glass
    const glassGeo = new THREE.BoxGeometry(2.5, 1.1, 0.1);
    const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.4, roughness: 0.1 });
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.set(0, 2.3, 5.76);
    bus.add(glass);

    // Functional Wipers
    for (let i = -0.6; i <= 0.6; i += 1.2) {
        const wiperGeo = new THREE.BoxGeometry(0.05, 0.8, 0.02);
        const wiperMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const wiper = new THREE.Mesh(wiperGeo, wiperMat);
        wiper.position.set(i, 2.1, 5.82);
        wipers.push(wiper);
        bus.add(wiper);
    }

    // Bus Passenger Folding Door
    const doorGeo = new THREE.BoxGeometry(0.1, 2.0, 1.0);
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x334155 });
    door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(1.31, 1.5, 4.0);
    bus.add(door);

    // Luggage Carrier on Roof
    const carrierGeo = new THREE.BoxGeometry(2.3, 0.3, 5.0);
    const carrierMat = new THREE.MeshStandardMaterial({ color: 0x090d16, wireframe: true });
    const carrier = new THREE.Mesh(carrierGeo, carrierMat);
    carrier.position.set(0, 3.15, -1);
    bus.add(carrier);

    // Wheels Assembly (Ground clearance 245mm)
    const wheelGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.5, 32);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });
    const wheelPositions = [[-1.25, 0.65, 3.5], [1.25, 0.65, 3.5], [-1.25, 0.65, -3.5], [1.25, 0.65, -3.5]];

    wheelPositions.forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(...pos);
        bus.add(wheel);
    });

    scene.add(bus);
}

// UI Controls & Handlers
function setupUIEvents() {
    // Engine On/Off
    document.getElementById('btn-engine').addEventListener('click', function () {
        isEngineOn = !isEngineOn;
        this.classList.toggle('running', isEngineOn);
        this.innerText = isEngineOn ? "🛑 Engine Stop" : "🔑 Engine Start";
        rpm = isEngineOn ? 900 : 0;
    });

    // Clutch Pedal
    const clutchBtn = document.getElementById('btn-clutch');
    clutchBtn.addEventListener('pointerdown', () => { isClutchPressed = true; clutchBtn.classList.add('active'); });
    clutchBtn.addEventListener('pointerup', () => { isClutchPressed = false; clutchBtn.classList.remove('active'); });

    // Accelerator Pedal
    document.getElementById('btn-accel').addEventListener('pointerdown', () => {
        if (isEngineOn) {
            if (gear === 0 && isClutchPressed) gear = 1;
            if (speed < 100) speed += 3;
            rpm = Math.min(3000, 900 + speed * 25);
        }
    });

    // Brake Pedal
    document.getElementById('btn-brake').addEventListener('pointerdown', () => {
        if (speed > 0) speed -= 6;
        if (speed < 0) speed = 0;
        rpm = Math.max(900, rpm - 100);
    });

    // Horn System
    document.getElementById('btn-horn-normal').addEventListener('click', () => playSound(440, 0.3));
    document.getElementById('btn-horn-pressure').addEventListener('click', () => playSound(660, 0.6));

    // Wiper System (Off / Slow / Fast)
    document.getElementById('btn-wiper').addEventListener('click', () => {
        wiperMode = (wiperMode + 1) % 3;
    });

    // Door Open/Close
    document.getElementById('btn-door').addEventListener('click', () => {
        if (speed === 0) {
            isDoorOpen = !isDoorOpen;
            door.position.x = isDoorOpen ? 1.0 : 1.31;
        }
    });

    // Steering Left / Right
    document.getElementById('btn-left').addEventListener('pointerdown', () => { if (bus) bus.position.x -= 0.3; });
    document.getElementById('btn-right').addEventListener('pointerdown', () => { if (bus) bus.position.x += 0.3; });
}

// Web Audio API for Real Horn Sounds
function playSound(freq, duration) {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

// Main Animation Loop
function animate() {
    requestAnimationFrame(animate);

    // Update Meter UI
    document.getElementById('speed-meter').innerText = speed;
    document.getElementById('gear-meter').innerText = gear === 0 ? 'N' : gear;
    document.getElementById('rpm-meter').innerText = isEngineOn ? Math.round(rpm) : 0;

    // Bus Movement
    if (speed > 0 && bus) {
        bus.position.z -= speed * 0.004;
        if (bus.position.z < -200) bus.position.z = 0; // Infinite Road Loop
    }

    // Wiper Animation Loop
    if (wiperMode > 0 && wipers.length > 0) {
        const speedFactor = wiperMode === 1 ? 0.05 : 0.12;
        wipers.forEach(w => {
            w.rotation.z = Math.sin(Date.now() * speedFactor) * 0.5;
        });
    }

    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

window.onload = initEngine;
