let charge = 0
let isSlamming = false
let isCharging = false
let isCutscene = false
let cutsceneDone = false
let hasShockwave = false
let nearVendingMachine = false

const MAX_CHARGE = 100
const GRAVITY = 1000

// Checkpoint System
let checkpointX = 20
let checkpointY = 20

namespace SpriteKind {
    export const UI = SpriteKind.create()
    export const Platform = SpriteKind.create()
    export const Environment = SpriteKind.create()
    export const Coin = SpriteKind.create()
    export const Shockwave = SpriteKind.create()
}

scene.setBackgroundColor(9)
info.setScore(0)

// --- PLAYER ---
let player = sprites.create(img`
    . . . . 8 8 8 8 . . . . 
    . . . 8 9 9 9 9 8 . . . 
    . . 8 9 f 9 9 f 9 8 . . 
    . . 8 9 9 9 9 9 9 8 . . 
    . . . 8 5 8 8 5 8 . . . 
    . . 8 8 9 9 9 9 8 8 . . 
    . 8 8 8 9 9 9 9 8 8 8 . 
    . 8 . 8 8 9 9 8 8 . 8 . 
    . . . . 8 8 8 8 . . . . 
    . . . 8 8 . . 8 8 . . . 
`, SpriteKind.Player)
player.ay = GRAVITY
player.z = 10

// --- MONSTER SPRITES ---
const MONSTER_FULL = img`
    . . . . . . . . . . . . . . . . 
    . . . . . . . 2 2 2 2 2 . . . . 
    . . . . . . 2 2 2 2 2 2 2 . . . 
    . . . . . 2 2 f 2 2 2 f 2 2 . . 
    . . . . 2 2 2 2 2 2 2 2 2 2 2 . 
    . . . 2 2 2 2 f f f f f 2 2 2 . 
    . . . 2 2 2 f 2 2 2 2 2 f 2 2 . 
    . . . 2 2 2 2 2 2 2 2 2 2 2 2 . 
    . . . 2 2 2 2 2 2 2 2 2 2 2 2 . 
    . . . . 2 2 2 2 2 2 2 2 2 2 . . 
    . . . . . . 2 2 2 2 2 . . . . . 
`

const MONSTER_BROKEN = img`
    . . . . . . . . . . . . . . . . 
    . . . . . . . . . 2 2 2 . . . . 
    . . . . . . . . 2 2 2 2 2 . . . 
    . . . . . . . f 2 2 2 f 2 2 . . 
    . . . . . 2 2 2 2 2 2 2 2 2 2 . 
    . . . 2 2 2 2 f f f f f 2 2 . . 
    . . . 2 2 2 f 2 2 2 2 2 f 2 2 . 
    . . . 2 2 2 . 2 2 2 2 2 2 2 2 . 
    . . . . 2 2 2 . 2 2 2 . 2 2 . . 
    . . . . 2 2 2 2 2 2 2 2 2 . . . 
    . . . . . . 2 2 . 2 2 . . . . . 
`

// --- ENEMIES ARRAY ---
let enemies: Sprite[] = []
let enemySpawnsX: number[] = []
let enemySpawnsY: number[] = []
let enemyMinX: number[] = []
let enemyMaxX: number[] = []
let enemyMaxHp: number[] = []
let enemyCurrentHp: number[] = []
let enemyStartBroken: boolean[] = []

function createMonster(x: number, y: number, minX: number, maxX: number, hp: number, isBroken: boolean = false) {
    let spriteImage = isBroken ? MONSTER_BROKEN : MONSTER_FULL
    let m = sprites.create(spriteImage, SpriteKind.Enemy)
    m.ay = GRAVITY
    m.scale = 1.5
    m.setPosition(x, y)
    enemies.push(m)
    enemySpawnsX.push(x)
    enemySpawnsY.push(y)
    enemyMinX.push(minX)
    enemyMaxX.push(maxX)
    enemyMaxHp.push(hp)
    enemyCurrentHp.push(hp)
    enemyStartBroken.push(isBroken)
}

// UI Meter
let meterSprite = sprites.create(image.create(52, 10), SpriteKind.UI)
meterSprite.setFlag(SpriteFlag.RelativeToCamera, true)
meterSprite.setPosition(80, 12)

function respawn() {
    if (checkpointX >= 520 && info.score() < 3) {
        checkpointX = 520
        checkpointY = -170
    }

    player.setPosition(checkpointX, checkpointY)
    player.vx = 0; player.vy = 0
    charge = 0; isSlamming = false; isCharging = false; isCutscene = false

    for (let i = 0; i < enemies.length; i++) {
        let m = enemies[i]
        m.setFlag(SpriteFlag.Invisible, false)
        m.setFlag(SpriteFlag.Ghost, false)
        m.setPosition(enemySpawnsX[i], enemySpawnsY[i])
        m.vx = 0
        enemyCurrentHp[i] = enemyMaxHp[i]
        m.setImage(enemyStartBroken[i] ? MONSTER_BROKEN : MONSTER_FULL)
    }
    controller.moveSprite(player, 100, 0)
}

function createPlatform(x: number, y: number, width: number, height: number) {
    let platImg = image.create(width, height)
    platImg.fill(14)
    let plat = sprites.create(platImg, SpriteKind.Platform)
    plat.left = x; plat.top = y
    return plat
}

function createCoin(x: number, y: number) {
    let coin = sprites.create(img`
        . . 5 5 5 5 . . 
        . 5 5 5 5 5 5 . 
        5 5 4 5 5 4 5 5 
        5 5 4 5 5 4 5 5 
        5 5 5 5 5 5 5 5 
        . 5 5 5 5 5 5 . 
        . . 5 5 5 5 . . 
    `, SpriteKind.Coin)
    coin.setPosition(x, y)
}

function buildWorld() {
    // --- KI (Phase 1: Introduction) ---
    createPlatform(0, 110, 80, 40)
    createPlatform(80, 95, 40, 60)
    createPlatform(120, 80, 40, 80)
    createPlatform(160, 65, 40, 100)
    createPlatform(200, 50, 60, 150)
    createPlatform(260, -20, 100, 250)

    createPlatform(380, -30, 50, 10)
    createPlatform(450, -70, 50, 10)
    createPlatform(520, -120, 50, 10)

    // --- SHŌ (Phase 2: Development & Chase) ---
    createPlatform(590, -150, 540, 400)
    createMonster(850, -162, 590, 1100, 1) // Spawns full
    createPlatform(750, -220, 40, 10); createCoin(750, -235)
    createPlatform(850, -270, 40, 10); createCoin(850, -285)
    createPlatform(950, -220, 40, 10); createCoin(950, -235)
    createPlatform(1100, -220, 16, 70)
    createPlatform(1130, -150, 150, 400)

    // Shō Continued (Floating Gauntlet)
    createPlatform(1330, -220, 240, 20); createPlatform(1432, -290, 16, 70)
    createMonster(1500, -232, 1448, 1570, 1) // Spawns full
    createPlatform(1630, -290, 240, 20); createPlatform(1732, -360, 16, 70)
    createMonster(1800, -302, 1748, 1870, 1) // Spawns full
    createPlatform(1930, -360, 240, 20); createPlatform(2032, -430, 16, 70)
    createMonster(2100, -372, 2048, 2170, 1) // Spawns full

    // --- TEN (Phase 3: The Twist - Vending Machine & Trap) ---
    createPlatform(2200, -360, 800, 400)

    let vm = sprites.create(img`
        . f f f f f f f f f f f f .
        . f 7 7 7 7 7 7 7 7 7 7 f .
        . f 7 f f f f f f f f 7 f .
        . f 7 f 8 8 8 8 8 8 f 7 f .
        . f 7 f 8 8 8 8 8 8 f 7 f .
        . f 7 f f f f f f f f 7 f .
        . f 7 7 7 7 7 7 7 7 7 7 f .
        . f 7 f f f f f f f f 7 f .
        . f 7 f d d d d d d f 7 f .
        . f 7 f d d d d d d f 7 f .
        . f 7 f f f f f f f f 7 f .
        . f 7 7 7 7 7 7 7 7 7 7 f .
        . f f f f f f f f f f f f .
    `, SpriteKind.Environment)
    vm.setPosition(2350, -375)

    // The Stuck Monster Tunnel Trap (Specifically targeted to spawn broken)
    createPlatform(2550, -1000, 150, 615)
    createMonster(2600, -372, 2550, 2700, 1, true)

    // --- KETSU (Phase 4: The Combat Gauntlet) ---
    createPlatform(2850, -360, 400, 40)
    createMonster(3000, -382, 2850, 3250, 2)

    createPlatform(3290, -360, 200, 40)
    createMonster(3390, -382, 3290, 3490, 2)

    createPlatform(3530, -360, 600, 40)
    createMonster(3630, -382, 3530, 4130, 2)
    createMonster(3930, -382, 3530, 4130, 2)

    createPlatform(4500, -1000, 40, 600)
}

buildWorld(); respawn()

// --- SHOCKWAVE ATTACK ---
function triggerShockwave(x: number, y: number) {
    let waveImg = img`
        . . . 8 8 8 8 8 8 . . .
        . 8 8 9 9 9 9 9 9 8 8 .
        8 9 9 1 1 1 1 1 1 9 9 8
    `
    let waveL = sprites.create(waveImg, SpriteKind.Shockwave)
    waveL.setPosition(x - 20, y); waveL.vx = -300; waveL.lifespan = 300

    let waveR = sprites.create(waveImg, SpriteKind.Shockwave)
    waveR.setPosition(x + 20, y); waveR.vx = 300; waveR.lifespan = 300
}

sprites.onOverlap(SpriteKind.Shockwave, SpriteKind.Enemy, function (wave, enemy) {
    wave.destroy()
    let idx = enemies.indexOf(enemy)

    if (idx !== -1) {
        enemyCurrentHp[idx] -= 1

        enemy.startEffect(effects.disintegrate, 200)

        if (enemyCurrentHp[idx] <= 0) {
            enemy.setFlag(SpriteFlag.Invisible, true)
            enemy.setFlag(SpriteFlag.Ghost, true)
            enemy.y = 9999
        } else {
            enemy.setImage(MONSTER_BROKEN)
        }
    }
})

function startCliffCutscene() {
    if (cutsceneDone || isCutscene) return
    isCutscene = true; cutsceneDone = true
    player.vx = 0; controller.moveSprite(player, 0, 0)
    control.runInParallel(function () {
        pause(1500)
        isCutscene = false
        controller.moveSprite(player, 100, 0)
    })
}

function checkIsGrounded(sprite: Sprite): boolean {
    for (let p of sprites.allOfKind(SpriteKind.Platform)) {
        if (sprite.right > p.left && sprite.left < p.right) {
            if (sprite.bottom >= p.top - 2 && sprite.bottom <= p.top + 10) return true
        }
    }
    return false
}

// --- CONTROLS ---
controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
    if (!isCutscene && checkIsGrounded(player) && !isCharging && !isSlamming) {
        player.vy = -240
    }
})

controller.B.onEvent(ControllerButtonEvent.Pressed, function () {
    if (nearVendingMachine && !hasShockwave) {
        let currentCoins = info.score()
        if (currentCoins >= 3) {
            hasShockwave = true
            player.sayText("Shockwave Potion Acquired!", 2000)
            player.startEffect(effects.halo, 1000)
        } else {
            let missing = 3 - currentCoins
            player.sayText("Missing " + missing + " coin" + (missing > 1 ? "s" : "") + "!", 2000)
        }
    }
})

controller.down.onEvent(ControllerButtonEvent.Pressed, function () {
    if (!isCutscene && !checkIsGrounded(player) && !isSlamming) {
        isSlamming = true; player.vy = 800; controller.moveSprite(player, 0, 0)
    }
})

controller.down.onEvent(ControllerButtonEvent.Released, function () {
    if (isCharging) {
        player.vy = -350 - (450 * (charge / MAX_CHARGE))
        isCharging = false; charge = 0
        if (!isCutscene) controller.moveSprite(player, 100, 0)
    } else if (isSlamming) {
        isSlamming = false
        if (!isCutscene) controller.moveSprite(player, 100, 0)
    }
})

// --- COIN COLLECTION ---
sprites.onOverlap(SpriteKind.Player, SpriteKind.Coin, function (sprite, otherSprite) {
    otherSprite.destroy()
    info.changeScoreBy(1)
})

// --- MAIN LOOP ---
let camY = 60
game.onUpdate(function () {
    let targetCamY = player.y - 20
    if (isCutscene) targetCamY = -50

    camY = (camY * 15 + targetCamY) / 16
    scene.centerCameraAt(player.x + 40, camY)

    if (player.x > 210 && player.x < 240 && !cutsceneDone) startCliffCutscene()

    // --- CHECKPOINT UPDATES ---
    if (player.x > 520 && checkpointX < 520) { checkpointX = 520; checkpointY = -170 }
    if (player.x > 1130 && checkpointX < 1130) { checkpointX = 1150; checkpointY = -200 }
    if (player.x > 1330 && checkpointX < 1330) { checkpointX = 1350; checkpointY = -270 }
    if (player.x > 1630 && checkpointX < 1630) { checkpointX = 1650; checkpointY = -340 }
    if (player.x > 1930 && checkpointX < 1930) { checkpointX = 1950; checkpointY = -410 }
    if (player.x > 2200 && checkpointX < 2200) { checkpointX = 2250; checkpointY = -400 }
    if (player.x > 2800 && checkpointX < 2800) { checkpointX = 2850; checkpointY = -400 }
    if (player.x > 3500 && checkpointX < 3500) { checkpointX = 3550; checkpointY = -400 }

    nearVendingMachine = false
    for (let vm of sprites.allOfKind(SpriteKind.Environment)) {
        if (player.overlapsWith(vm)) {
            nearVendingMachine = true
            if (!hasShockwave) {
                vm.sayText("Press B: Potion", 100)
            }
        }
    }

    let currentlyOnPlat = false
    for (let p of sprites.allOfKind(SpriteKind.Platform)) {
        if (player.overlapsWith(p)) {
            let snapWindow = (player.vy > 300) ? 35 : 10
            if (player.vy >= 0 && player.bottom <= p.top + snapWindow) {
                player.bottom = p.top; player.vy = 0; currentlyOnPlat = true
            } else {
                if (player.x < p.x) player.right = p.left; else player.left = p.right
            }
        }
    }

    for (let i = 0; i < enemies.length; i++) {
        let m = enemies[i]

        if (Math.abs(player.y - m.y) < 150 && Math.abs(player.x - m.x) < 250) {
            m.ax = (player.x > m.x) ? 140 : -140
        } else {
            m.ax = 0; m.vx *= 0.9
        }
        m.vx = Math.clamp(-70, 70, m.vx)

        if (m.left < enemyMinX[i]) {
            m.left = enemyMinX[i]; m.vx = 0
        }
        if (m.right > enemyMaxX[i]) {
            m.right = enemyMaxX[i]; m.vx = 0
        }

        for (let p of sprites.allOfKind(SpriteKind.Platform)) {
            if (m.overlapsWith(p)) {
                let snapWindow = (m.vy > 300) ? 35 : 10
                if (m.vy >= 0 && m.bottom <= p.top + snapWindow) {
                    m.bottom = p.top; m.vy = 0
                } else {
                    if (m.x < p.x) { m.right = p.left; m.vx = 0 }
                    else { m.left = p.right; m.vx = 0 }
                }
            }
        }

        if (player.overlapsWith(m) && !(m.flags & SpriteFlag.Ghost)) respawn()
    }

    if (currentlyOnPlat) {
        if (isSlamming) {
            isSlamming = false; isCharging = true; scene.cameraShake(4, 200)
            if (hasShockwave) {
                triggerShockwave(player.x, player.bottom - 5)
            }
        } else if (!isCharging && !isCutscene) {
            controller.moveSprite(player, 100, 0)
        }
    }

    if (isCharging) charge = Math.min(MAX_CHARGE, charge + 5)
    if (player.y > 600) respawn()

    meterSprite.image.fill(0); meterSprite.image.fillRect(0, 0, 52, 10, 15)
    meterSprite.image.fillRect(1, 1, 50, 8, 1); meterSprite.image.fillRect(1, 1, (charge / MAX_CHARGE) * 50, 8, 9)
})

// --- PROCEDURAL HEALTH BARS ---
scene.createRenderable(11, function (target, camera) {
    for (let i = 0; i < enemies.length; i++) {
        let m = enemies[i]
        if (!(m.flags & SpriteFlag.Ghost) && !(m.flags & SpriteFlag.Invisible)) {
            let screenX = m.x - camera.drawOffsetX - 10
            let screenY = m.y - camera.drawOffsetY - 18

            target.fillRect(screenX, screenY, 20, 3, 2)

            let percentage = enemyCurrentHp[i] / enemyMaxHp[i]
            let fillWidth = Math.floor(20 * percentage)
            target.fillRect(screenX, screenY, fillWidth, 3, 7)
        }
    }
})