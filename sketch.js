// =============================================
//  ANOXIA — p5.js Sketch
//  Jellyfish simulation · minimalist · neon
// =============================================

// ---- Global State ----
let jellyfish   = [];   // Jellyfish instances
let particles   = [];   // Microplastic particle instances

// DOM references
let sliderCount;
let sliderCO2;
let sliderPhosphorus;
let countDisplay, co2Display, phosphorusDisplay;

// ---- p5 setup() — runs once on load ----
function setup() {
  let cnv = createCanvas(windowWidth, windowHeight);
  cnv.parent('canvas-container');

  // Grab all sliders and readouts from HTML
  sliderCount      = select('#countSlider');
  sliderCO2        = select('#co2Slider');
  sliderPhosphorus = select('#phosphorusSlider');
  countDisplay     = select('#countDisplay');
  co2Display       = select('#co2Display');
  phosphorusDisplay = select('#phosphorusDisplay');

  // Spawn initial jellyfish
  for (let i = 0; i < int(sliderCount.value()); i++) {
    jellyfish.push(new Jellyfish());
  }

  // Spawn initial microplastic particles (matches slider default)
  // Particles are more numerous — multiply count for visual density
  let initParticles = particleTarget(int(sliderCount.value()));
  for (let i = 0; i < initParticles; i++) {
    particles.push(new Particle());
  }
}

// ---- How many particles per jellyfish count value ----
// Each "unit" on the slider spawns 8 particles for visible density
function particleTarget(jellyCount) {
  return jellyCount * 8;
}

// ---- p5 draw() — loops every frame ----
function draw() {
  // ---- Read current slider values ----
  let desiredJelly  = int(sliderCount.value());
  let co2Level      = int(sliderCO2.value());      // 0–100
  let phosphorus    = int(sliderPhosphorus.value()); // 0–100

  // ---- Update DOM readouts ----
  countDisplay.html(String(desiredJelly).padStart(2, '0'));
  co2Display.html(String(co2Level).padStart(2, '0'));
  phosphorusDisplay.html(String(phosphorus).padStart(2, '0'));

  // ---- Compute background color ----
  // Base: deep navy (hue ~225). CO2 shifts hue toward yellow (~55).
  // Phosphorus darkens the lightness value.
  let baseHue   = 225;
  let targetHue = 55;                                          // yellow
  let bgHue     = lerp(baseHue, targetHue, co2Level / 100);   // interpolate

  // Phosphorus darkens: lightness goes from 4% (neutral) down to 1%
  let bgLight = lerp(4, 1.2, phosphorus / 100);

  // Saturation drops slightly as water turns murky yellow
  let bgSat = lerp(72, 55, co2Level / 100);

  // Background with slight alpha for motion blur trail
  colorMode(HSL);
  background(bgHue, bgSat, bgLight, 0.88);
  colorMode(RGB);   // back to RGB for the rest of the drawing

  // ---- Sync jellyfish array with slider ----
  if (desiredJelly > jellyfish.length) {
    while (jellyfish.length < desiredJelly) jellyfish.push(new Jellyfish());
  } else if (desiredJelly < jellyfish.length) {
    jellyfish.splice(desiredJelly);
  }

  // ---- Sync particle array with microplastic slider ----
  let desiredParticles = particleTarget(desiredJelly);
  if (desiredParticles > particles.length) {
    while (particles.length < desiredParticles) particles.push(new Particle());
  } else if (desiredParticles < particles.length) {
    particles.splice(desiredParticles);
  }

  // ---- Draw particles (behind jellyfish) ----
  for (let p of particles) {
    p.update();
    p.draw();
  }

  // ---- Draw jellyfish, passing phosphorus for size scaling ----
  for (let jf of jellyfish) {
    jf.update();
    jf.draw(phosphorus);
  }
}

// ---- Resize canvas on window change ----
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}


// =============================================
//  CLASS: Particle
//  A tiny drifting microplastic dot (red).
// =============================================
class Particle {

  constructor() {
    this.reset(true); // true = randomise Y across full screen on spawn
  }

  reset(fullScreen) {
    this.x     = random(width);
    this.y     = fullScreen ? random(height) : random(-10, 0);
    this.r     = random(1, 3.5);          // radius — tiny dots
    this.speedX = random(-0.18, 0.18);
    this.speedY = random(0.08, 0.3);      // slow downward drift
    this.alpha  = random(140, 220);       // slight transparency variety
    // Drift using noise for organic movement
    this.noiseOff = random(0, 2000);
  }

  update() {
    // Gentle lateral sway via noise
    let sway = (noise(this.noiseOff) * 2 - 1) * 0.25;
    this.x += this.speedX + sway;
    this.y += this.speedY;
    this.noiseOff += 0.003;

    // Wrap horizontally, respawn from top when off-screen bottom
    if (this.x < 0)       this.x = width;
    if (this.x > width)   this.x = 0;
    if (this.y > height)  this.reset(false);
  }

  draw() {
    noStroke();
    // Neon-red with soft glow: draw two circles — large dim + small bright
    fill(255, 50, 50, this.alpha * 0.3);     // glow halo
    ellipse(this.x, this.y, this.r * 3.5, this.r * 3.5);

    fill(255, 70, 70, this.alpha);           // crisp dot
    ellipse(this.x, this.y, this.r * 1.8, this.r * 1.8);
  }
}


// =============================================
//  CLASS: Jellyfish
//  One floating entity in the simulation.
// =============================================
class Jellyfish {

  constructor() {
    this.x    = random(width);
    this.y    = random(height);

    // Base size — phosphorus will scale this in draw()
    this.baseSize = random(24, 72);

    this.noiseOffsetX = random(0, 1000);
    this.noiseOffsetY = random(0, 1000);
    this.speed        = random(0.35, 0.85);
    this.pulsePhase   = random(TWO_PI);

    this.tentacleCount   = int(random(4, 8));
    this.tentacleOffsets = Array.from({ length: this.tentacleCount },
                                      () => random(1000));

    // Each jellyfish gets a unique hue in cyan → ice-blue range
    this.hue = random(185, 210);
  }

  update() {
    let nx = noise(this.noiseOffsetX) * 2 - 1;
    let ny = noise(this.noiseOffsetY) * 2 - 1;

    this.x += nx * this.speed;
    this.y += ny * this.speed * 0.6;

    this.noiseOffsetX += 0.004;
    this.noiseOffsetY += 0.004;

    let margin = this.baseSize * 2;
    if (this.x < -margin)         this.x = width  + margin;
    if (this.x >  width + margin) this.x = -margin;
    if (this.y < -margin)         this.y = height + margin;
    if (this.y >  height + margin) this.y = -margin;
  }

  // phosphorus (0–100) scales bell size: 0 = normal, 100 = 2× bigger
  draw(phosphorus) {
    // Compute actual size from phosphorus level
    // Scale factor: 1.0 at phosphorus=0 → 2.0 at phosphorus=100
    let sizeMult = map(phosphorus, 0, 100, 1.0, 2.0);
    this.size = this.baseSize * sizeMult;

    push();
    translate(this.x, this.y);

    let pulse = 1 + sin(frameCount * 0.04 + this.pulsePhase) * 0.07;
    scale(pulse);

    let col     = color(`hsla(${this.hue}, 100%, 65%, 1)`);
    let glowCol = color(`hsla(${this.hue}, 100%, 70%, 0.18)`);

    noFill();

    // Glow pass
    stroke(glowCol);
    strokeWeight(4);
    this._drawBell(this.size * 1.08);

    // Main neon outline
    stroke(col);
    strokeWeight(1.1);
    this._drawBell(this.size);

    this._drawInnerDetail();
    this._drawTentacles();

    pop();
  }

  _drawBell(r) {
    arc(0, 0, r * 2, r * 2, PI, TWO_PI);
  }

  _drawInnerDetail() {
    let r = this.size;
    for (let i = 1; i <= 3; i++) {
      let fraction = i / 4;
      let innerR   = r * fraction;
      let alpha    = map(i, 1, 3, 0.5, 0.15);
      stroke(color(`hsla(${this.hue}, 100%, 70%, ${alpha})`));
      arc(0, 0, innerR * 2, innerR * 2 * 0.6, PI, TWO_PI);
    }
  }

  _drawTentacles() {
    let r = this.size;
    stroke(color(`hsla(${this.hue}, 100%, 65%, 0.55)`));
    strokeWeight(0.9);

    for (let i = 0; i < this.tentacleCount; i++) {
      let t      = i / (this.tentacleCount - 1);
      let startX = map(t, 0, 1, -r * 0.9, r * 0.9);
      let startY = 0;
      let len    = r * random(1.0, 2.2);

      let swayAmt   = r * 0.22;
      let swaySpeed = 0.025;
      let sway      = sin(frameCount * swaySpeed + this.tentacleOffsets[i]) * swayAmt;

      beginShape();
      vertex(startX, startY);
      quadraticVertex(
        startX + sway,
        startY + len * 0.5,
        startX + sway * 1.6,
        startY + len
      );
      endShape();
    }
  }
}
