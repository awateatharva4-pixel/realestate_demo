console.log("Premier Estates — Initializing Scroll Experience...");

gsap.registerPlugin(ScrollTrigger);

const canvas = document.getElementById("scroll-canvas");
const ctx    = canvas.getContext("2d");

// ── High DPI Canvas Setup ──────────────────────────────────────────────────
function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = window.innerWidth  * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width  = window.innerWidth  + "px";
    canvas.style.height = window.innerHeight + "px";
    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
}
resizeCanvas();

// ── Frame State ────────────────────────────────────────────────────────────
let frameCount  = 1;
let drawnFrame  = 0;   // What is actually drawn on canvas
let targetFrame = 0;   // Where scroll wants us to be

// Frame path helper (renamed to avoid collision with drawnFrame variable)
const framePath = i => `assets/frames/frame_${String(i).padStart(4, "0")}.webp`;

const seq    = { frame: 0 };
const images = [];
let loadedCount = 0;

// ── Lerp Engine (runs at 60fps after load) ─────────────────────────────────
const LERP = 0.12;
function lerp(a, b, t) { return a + (b - a) * t; }

function lerpLoop() {
    requestAnimationFrame(lerpLoop);
    drawnFrame = lerp(drawnFrame, targetFrame, LERP);
    const idx = Math.round(drawnFrame);
    if (images[idx] && seq.frame !== idx) {
        seq.frame = idx;
        render();
    }
}

// ── Preloader ──────────────────────────────────────────────────────────────
function initPreload(count) {
    frameCount = count;

    for (let i = 0; i < frameCount; i++) {
        const img = new Image();
        img.src = framePath(i);
        images.push(img);

        img.onload = () => {
            loadedCount++;
            const pct = Math.floor((loadedCount / frameCount) * 100);
            document.getElementById("load-progress").textContent = pct;
            const bar = document.getElementById("load-bar");
            if (bar) bar.style.width = pct + "%";

            if (loadedCount === frameCount) {
                gsap.to("#loading-screen", {
                    opacity: 0, duration: 1.2, ease: "power2.inOut",
                    onComplete: () => {
                        document.getElementById("loading-screen").style.display = "none";
                    }
                });
                render();
                setupScrollAnimation();
            }
        };

        img.onerror = () => { loadedCount++; };
    }
}

// ── Render ─────────────────────────────────────────────────────────────────
function render() {
    const img = images[seq.frame];
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const imgRatio    = img.naturalWidth / img.naturalHeight;
    const canvasRatio = vw / vh;

    let drawW, drawH, offX, offY;
    if (canvasRatio > imgRatio) {
        drawW = vw; drawH = vw / imgRatio; offX = 0; offY = (vh - drawH) / 2;
    } else {
        drawH = vh; drawW = vh * imgRatio; offX = (vw - drawW) / 2; offY = 0;
    }

    ctx.clearRect(0, 0, vw, vh);
    ctx.drawImage(img, offX, offY, drawW, drawH);
}

// ── GSAP Scroll Setup ──────────────────────────────────────────────────────
function setupScrollAnimation() {

    // Start lerp loop
    lerpLoop();

    // GSAP only sets targetFrame — lerp loop does the actual drawing
    gsap.to({ f: 0 }, {
        f: frameCount - 1,
        ease: "none",
        scrollTrigger: {
            trigger: ".scroll-content",
            start:   "top top",
            end:     "bottom bottom",
            scrub:   2.5,
        },
        onUpdate: function() {
            targetFrame = Math.round(this.targets()[0].f);
        }
    });

    // Text panel animations
    gsap.utils.toArray(".panel-text").forEach((box, i) => {
        if (i === 0) {
            gsap.from(box, { opacity: 0, y: 30, duration: 1.5, ease: "power3.out", delay: 0.5 });
            return;
        }
        gsap.from(box, {
            scrollTrigger: {
                trigger: box,
                start: "top 80%",
                toggleActions: "play none none reverse"
            },
            y: 80, opacity: 0, duration: 1.2, ease: "power3.out"
        });
    });
}

// ── Resize ─────────────────────────────────────────────────────────────────
window.addEventListener("resize", () => {
    resizeCanvas();
    render();
    ScrollTrigger.refresh();
});

// ── Boot: Load frame config then start preloading ──────────────────────────
fetch("assets/frame_config.json")
    .then(r => r.json())
    .then(cfg => {
        console.log(`Frame config loaded. Total: ${cfg.total_frames}`);
        initPreload(cfg.total_frames);
    })
    .catch(() => {
        console.warn("frame_config.json not found, probing...");
        let count = 0;
        function probe() {
            const img = new Image();
            img.onload  = () => { count++; probe(); };
            img.onerror = () => { count > 0 ? initPreload(count) : console.error("No frames found!"); };
            img.src = framePath(count);
        }
        probe();
    });
