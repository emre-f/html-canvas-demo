const canvas = document.querySelector('canvas');
const scoreEl = document.querySelector('#scoreEl');
const startGameBtn = document.querySelector('#startGameBtn');
const modalEl = document.querySelector('#modalEl');
const bigScoreEl = document.querySelector('#bigScoreEl');

// Context of the canvas
// Will allow drawing on the canvas
const c = canvas.getContext('2d'); 

canvas.width = innerWidth;
canvas.height = innerHeight;

class Player {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;

        this.radius = radius;
        this.color = color;
    }

    draw() {
        c.beginPath();
        c.arc(this.x, this.y, // Position
              this.radius, // Radius
              0, Math.PI * 2, // The arc (we want a full circle)
              false) // draw counter clockwise? doesn't matter
        c.fillStyle = this.color;
        c.fill();
    }
}

let projectiles = [];
class Projectile {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }

    draw() {
        c.beginPath();
        c.arc(this.x, this.y, // Position
              this.radius, // Radius
              0, Math.PI * 2, // The arc (we want a full circle)
              false) // draw counter clockwise? doesn't matter
        c.fillStyle = this.color;
        c.fill();
    }

    update() {
        this.draw();
        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;
    }
}

let enemies = [];
class Enemy {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }

    draw() {
        c.beginPath();
        c.arc(this.x, this.y, // Position
              this.radius, // Radius
              0, Math.PI * 2, // The arc (we want a full circle)
              false) // draw counter clockwise? doesn't matter
        c.fillStyle = this.color;
        c.fill();
    }

    update() {
        this.draw();
        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;
    }
}

let particles = [];
const friction = 0.99;
class Particle {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
        this.alpha = 1;
    }

    draw() {
        c.save();
        c.globalAlpha = this.alpha;
        c.beginPath();
        c.arc(this.x, this.y, // Position
              this.radius, // Radius
              0, Math.PI * 2, // The arc (we want a full circle)
              false) // draw counter clockwise? doesn't matter
        c.fillStyle = this.color;
        c.fill();
        c.restore();
    }

    update() {
        this.draw();

        // slow over time
        this.velocity.x *= friction;
        this.velocity.y *= friction;

        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;
        this.alpha -= 0.01;
    }
}

function spawnEnemies() {
    setInterval(() => {
        const radius = Math.random() * (30 - 4) + 4

        let x;
        let y;

        if (Math.random < 0.5) {
            x =  Math.random() < 0.5 ? 0 - radius: canvas.width + radius; // spawn left or right
            y =  Math.random() * canvas.height;
        } else {
            y =  Math.random() < 0.5 ? 0 - radius: canvas.height + radius; // spawn up or down
            x = Math.random() * canvas.width;
        }
        
        const color = `hsl(${Math.random() * 360}, 50%, 50%)`; // Give enemy random color

        const velocity = getUnitVector({x, y}, {x: canvas.width / 2, y: canvas.height /2}, (Math.random() * 0.35));

        enemies.push(new Enemy(x, y, radius, color, velocity))
    }, 1000)
}

let score = 0;
function animate() {
    let animationId = requestAnimationFrame(animate);
    
    c.fillStyle = 'rgba(0, 0, 0, 0.1)' // 0.1 to make the fade effect
    c.fillRect(0, 0, canvas.width, canvas.height); // clear the screen
    player.draw();

    projectiles.forEach((projectile, index) => {
        projectile.update();

        if(projectile.x + projectile.radius < 0 || 
           projectile.x - projectile.radius > canvas.width ||
           projectile.y + projectile.radius < 0 ||
           projectile.y - projectile.radius > canvas.height) {
            setTimeout(() => {
                projectiles.splice(index, 1); // Remove projectile out of screen
            }, 0) // Wait until next frame to finish drawing
        }
    });

    enemies.forEach((enemy, index) => {
        enemy.update();

        const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y)

        // Collision with player
        if (dist - enemy.radius - player.radius < 1) {
            // End game
            cancelAnimationFrame(animationId);
            modalEl.style.display = 'flex';
            bigScoreEl.innerHTML = score;
        }

        // Collision detection
        projectiles.forEach((projectile, projectileIndex) => {
            const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y)

            // Collision with projectile
            if (dist - enemy.radius - projectile.radius < 1) {

                // Create particle explosion
                for (let i = 0; i < 16; i++) {
                    particles.push(
                        new Particle(
                            projectile.x, 
                            projectile.y, 
                            Math.random() * 2, 
                            enemy.color, 
                            {
                                x: (Math.random() - 0.5) * (Math.random() * 8), 
                                y: (Math.random() - 0.5) * (Math.random() * 8),
                            }
                        )
                    )
                }

                // Shrink large enemies
                if(enemy.radius - 10 > 5) { // -10 to clear out really small enemies

                    gsap.to(enemy, {
                        radius: enemy.radius -= 10
                    })
                    
                    setTimeout(() => {
                        projectiles.splice(projectileIndex, 1);
                    }, 0) // Wait until the next frame, so the enemies don't blink 

                } else { // Destroy small enemies
                    
                    // Increase our score
                    score += 1;
                    scoreEl.innerHTML = score;

                    setTimeout(() => {
                        enemies.splice(index, 1);
                        projectiles.splice(projectileIndex, 1);
                    }, 0) // Wait until the next frame, so the enemies don't blink 
                }
            }
        })
    })

    particles.forEach((particle, index) => {
        if(particle.alpha <= 0) {
            particles.splice(index, 1);
        } else {
            particle.update();
        }
    })
}

let player = new Player(canvas.width/2, canvas.height/2, 10, 'white')

function init() {
    score = 0;
    scoreEl.innerHTML = score;
    bigScoreEl.innerHTML = score;
    player = new Player(canvas.width/2, canvas.height/2, 10, 'white');
    projectiles = [];
    enemies = [];
    particles = [];
}

startGameBtn.addEventListener('click', () => {
    init();
    animate();
    spawnEnemies();
    modalEl.style.display = 'none';
});

addEventListener('click', (event) => {
    const velocity = getUnitVector({x: canvas.width / 2, y: canvas.height /2}, {x: event.clientX, y: event.clientY}, 4)

    const projectile = new Projectile(
        canvas.width/2, canvas.height/2,
        5, 
        'white',
        velocity 
    )

    projectiles.push(projectile);
});

function getUnitVector(start, end, multiplier = 1) {
    let directionVector = {
        x: end.x - start.x,
        y: end.y - start.y
    }

    const length = Math.sqrt(directionVector.x * directionVector.x + directionVector.y * directionVector.y);
    const unitVector = {
        x: (directionVector.x / length) * multiplier,
        y: (directionVector.y / length) * multiplier
    }

    return unitVector;
}
