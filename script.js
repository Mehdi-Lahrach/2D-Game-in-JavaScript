const canvas = document.querySelector('canvas')

const c = canvas.getContext('2d')

canvas.width = innerWidth
canvas.height = innerHeight

const scoreEL = document.querySelector('#scoreEL')
const highScore = document.querySelector('#highScore')
const startGameBtn = document.querySelector('#startGameBtn')
const modelEl = document.querySelector('#modelEl')
const scoreH1 = document.querySelector('#scoreH1')

var music = {
    overworld: new Howl({
        src: ['Music/Powerup.mp3']
    })
}

var sfx = {
    lasershoot: new Howl({
        src: ['Music/Laser-Gun.mp3']
    }),
    enemyExplode: new Howl({
        src: ['Music/Explode.wav']
    }),
    enemyHit: new Howl({
        src: ['Music/EnemyHitSound1.wav']
    }),
    enemyHit2: new Howl({
        src: ['Music/EnemyHitSound2.wav']
    }),
    gotHitByEnemySound: new Howl({
        src: ['Music/GotHitByEnemy.wav']
    })
}
sfx.lasershoot.mute(true)



class Player{
    constructor(x,y,radius,color){
        this.x =x
        this.y=y
        this.radius=radius
        this.color=color
    }
    draw(){
        c.beginPath();
        c.arc(this.x, this.y,this.radius,0,Math.PI*2,false)
        c.fillStyle =this.color
        c.fill()
    }
}

class Projectile{
    constructor(x,y,radius,color,velocity){
        this.x =x
        this.y=y
        this.radius = radius
        this.color =color
        this.velocity=velocity
    }
    draw(){
        c.beginPath();
        c.arc(this.x, this.y,this.radius,0,Math.PI*2,false)
        c.fillStyle =this.color
        c.fill()
    }
    update(){
        this.draw()
        this.x=this.x +this.velocity.x
        this.y=this.y +this.velocity.y
    }
}


const x = canvas.width/2
const y = canvas.height/2

let player = new Player(x,y,10, 'white')
let enemies = []
let projectiles = []
let particles = []
let speedOfTheGame 
function init() {
     player = new Player(x,y,10, 'white')
     enemies = []
     projectiles = []
     particles = []
     score =0
     speedOfTheGame = 1000
     scoreEL.innerHTML =score
     scoreH1.innerHTML =score
}

class Enemy{
    constructor(x,y,radius,color,velocity){
        this.x =x
        this.y=y
        this.radius = radius
        this.color =color
        this.velocity=velocity
    }
    draw(){
        c.beginPath();
        c.arc(this.x, this.y,this.radius,0,Math.PI*2,false)
        c.fillStyle =this.color
        c.fill()
    }
    update(){
        this.draw()
        this.x=this.x +this.velocity.x
        this.y=this.y +this.velocity.y
    }
}
const friction = 0.99
class  Particle{
    constructor(x,y,radius,color,velocity){
        this.x =x
        this.y=y
        this.radius = radius
        this.color =color
        this.velocity=velocity
        this.alpha = 1
    }
    draw(){
        c.save()
        c.globalAlpha = this.alpha
        c.beginPath();
        c.arc(this.x, this.y,this.radius,0,Math.PI*2,false)
        c.fillStyle =this.color
        c.fill()
        c.restore()
    }
    update(){
        this.draw()
        this.velocity.x *= friction
        this.velocity.y *= friction 
        this.x=this.x +this.velocity.x
        this.y=this.y +this.velocity.y
        this.alpha -= 0.01
    }
}
let enemySpeed;
function spawnEnemies(){
    
    setInterval(() => {
        const radius = Math.random() * (30-4)+4
        let x
        let y
        if(Math.random()<0.5){
             x = Math.random()<0.5 ? 0-radius:canvas.width +radius
             y = Math.random()*canvas.height
        }else{
             y = Math.random()<0.5 ? 0-radius:canvas.height +radius
             x = Math.random()*canvas.width
        }
        
       
        const color = `hsl(${Math.random()*360}, 50%, 50%`
        const angle = Math.atan2(canvas.height/2 -y, canvas.width/2 -x)

        //increasse for monster to go fast
        const velocity ={
        x:Math.cos(angle)  ,
        y:Math.sin(angle) 
        }
        enemies.push(new Enemy(x, y ,radius, color,velocity))
    },speedOfTheGame)
    console.log(speedOfTheGame)
}
let animationId
let score = 0
let highScoreVar = 0

function animate() { 
    animationId = requestAnimationFrame(animate)
    c.fillStyle = 'rgba(0, 0, 0, 0.1)'
    c.fillRect(0,0, canvas.width, canvas.height)
    player.draw()

    //loop in particles
    particles.forEach((particle , index)=> {
        if (particle.alpha <= 0) {
            particles.splice(index, 1)
        }else{
            particle.update()
        }
    })

    // loop in projectiles
    projectiles.forEach((projectile ,projectileIndex) => {
        projectile.update()
        //remove from screen
        if(projectile.x + projectile.radius <0 || 
            projectile.x - projectile.radius >canvas.width ||
            projectile.y + projectile.radius <0 ||
            projectile.y -projectile.radius > canvas.height){
            setTimeout(()=>{
                projectiles.splice(projectileIndex,1)
             },0)   
        }
    })

    //loop in enemies
    enemies.forEach((enemy , index) => {
        enemy.update()
        const dist = Math.hypot(player.x-enemy.x, player.y-enemy.y)

        //end game
        if (dist -enemy.radius-player.radius < 1) {
            //play death sound
            sfx.gotHitByEnemySound.play()
            
            //stop sponing enemies
            enemies = []


            cancelAnimationFrame(animationId)
            scoreH1.innerHTML =score
            if (score > highScoreVar) {
                highScoreVar =score
                highScore.innerHTML = score
            }
            modelEl.style.display ='flex'

            //sounds configuration
            music.overworld.stop();
            sfx.lasershoot.mute(true);
        }
        projectiles.forEach((projectile , projectileIndex) =>{
            const dist = Math.hypot(projectile.x -enemy.x, projectile.y-enemy.y)
            
            //when projectile touch enemy
            if(dist -enemy.radius-projectile.radius<1){
               
                //create explosions
                for (let index = 0; index < enemy.radius; index++) {
                    particles.push(new Particle(projectile.x, projectile.y ,Math.random() *2,enemy.color,
                    {x:(Math.random()-0.5) * 6, 
                    y: (Math.random()-0.5) *6 }))
                }
                //enemy is big
                if (enemy.radius - 10 > 5) {
                    //play hit sound
                    if (Math.random() > 0.5) {
                        sfx.enemyHit.play()
                    }else{
                        sfx.enemyHit2.play()
                    }
                     //increase our score
                    score +=100
                    scoreEL.innerHTML = score

                    //decreasse speed of spawning the enemyes
                    speedOfTheGame += Math.random()

                    gsap.to(enemy, {
                        radius: enemy.radius - 10
                    })
                    setTimeout(()=>{
                        projectiles.splice(projectileIndex,1)
                     },0)
                }else{
                 //enemy removed from screen

                 //play explosion sound
                 sfx.enemyExplode.play()
                 
                 //increasse speed of spawning the enemyes
                 speedOfTheGame -= Math.random()*(10-1)+1
                 
                 console.log(speedOfTheGame)
                 score += 200
                 scoreEL.innerHTML = score
                 
                     setTimeout(()=>{
                enemies.splice(index,1)
                projectiles.splice(projectileIndex,1)
             },0)
                }
               
            }
        })
    })
}

addEventListener('click', (event) =>{
  
  const angle = Math.atan2(event.clientY - canvas.height/2, event.clientX-canvas.width/2)

  const velocity ={
      // incress number to fast shoting 
      x:Math.cos(angle) * 5,
      y:Math.sin(angle) * 5
  }

  projectiles.push( new Projectile(canvas.width/2 , canvas.height/2 , 5 ,'white',velocity))

  sfx.lasershoot.play();

})

startGameBtn.addEventListener('click' , ()=> {
    init()
    animate()
    spawnEnemies()
    modelEl.style.display ='none'
    //play music
    if (!music.overworld.playing()) {
        music.overworld.play();
    }    
    sfx.lasershoot.mute(false);

})

