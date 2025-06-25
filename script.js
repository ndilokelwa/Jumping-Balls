import * as THREE from 'three';

// Setup scene, camera, renderer
const canvas = document.getElementById('canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

const fov = 75;
const aspect = window.innerWidth / window.innerHeight;
const near = 0.1;
const far = 1000;
const cameraZ = 5;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.z = cameraZ;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xadd8e6); // blue background

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(3, 5, 5);
scene.add(light);

// Calculate screen bounds at Z = 0
const screenWidth = 2 * cameraZ * Math.tan((fov * Math.PI) / 360);
const screenHeight = screenWidth / aspect;
const minX = -screenWidth / 2;
const maxX = screenWidth / 2;

const texturePaths = [
  './textures/1060.jpg','./textures/9562.jpg','./textures/basketball-ball.jpg','./textures/black-shine-balls-background.jpg',
  './textures/blue_voronoi_pattern_background.jpg','./textures/close-up-texture-citrus-fruit-skin.jpg','./textures/green-fake-grass-background.jpg',
  './textures/O4YIO70.jpg'
];

const textureLoader = new THREE.TextureLoader();
const balls = [];

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Mouse move tracking
window.addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
});

class Ball {
  constructor(texturePath) {
    this.radius = Math.random();
    this.geometry = new THREE.SphereGeometry(this.radius, 32, 32);
    this.material = new THREE.MeshStandardMaterial({
      map: textureLoader.load(texturePath)
    });
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    scene.add(this.mesh);

    // Original scale
    this.originalScale = this.mesh.scale.clone();
    this.isHovered = false;

    // Movement logic
    this.direction = Math.random() < 0.5 ? 1 : -1;
    this.stepDistance = 0.5 + Math.random();
    this.arcHeight = THREE.MathUtils.randFloat(0.3, screenHeight * 0.5);
    this.jumpDuration = 0.5 + Math.random() * 0.5;
    this.jumpStartTime = null;
    this.jumpStartPos = new THREE.Vector3();
    this.target = new THREE.Vector3();

    this.mesh.position.set(
      THREE.MathUtils.randFloat(minX, maxX),
      0,
      0
    );
  }

  startNewJump() {
    this.jumpStartTime = performance.now() / 1000;
    this.jumpStartPos.copy(this.mesh.position);

    let nextX = this.mesh.position.x + this.stepDistance * this.direction;
    if (nextX > maxX) {
      nextX = maxX;
      this.direction = -1;
    } else if (nextX < minX) {
      nextX = minX;
      this.direction = 1;
    }

    this.target.set(nextX, 0, 0);
  }

  getArcPosition(t) {
    const pos = new THREE.Vector3().lerpVectors(this.jumpStartPos, this.target, t);
    const yArc = Math.sin(Math.PI * t) * this.arcHeight;
    pos.y += yArc;
    return pos;
  }

  update(time) {
    if (this.jumpStartTime === null) {
      this.startNewJump();
    }

    const elapsed = time - this.jumpStartTime;
    const t = Math.min(elapsed / this.jumpDuration, 1);
    const arcPos = this.getArcPosition(t);
    this.mesh.position.copy(arcPos);

    if (t >= 1) {
      this.startNewJump();
    }

    // Hover scale effect
    const targetScale = this.isHovered ? 1.7 : 1.0;
    this.mesh.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      0.2
    );
  }
}

// Create 10 balls
for (let i = 0; i < 10; i++) {
  balls.push(new Ball(texturePaths[THREE.MathUtils.randInt(0, texturePaths.length - 1)]));
}

// Animate
function animate() {
  requestAnimationFrame(animate);
  const time = performance.now() / 1000;

  // Raycast from mouse
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(balls.map(b => b.mesh));

  balls.forEach(ball => {
    // Mark hovered
    ball.isHovered = intersects.some(i => i.object === ball.mesh);
    ball.update(time);
  });

  renderer.render(scene, camera);
}
animate();
