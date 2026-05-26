let charge = 0
let isSlamming = false
let isCharging = false
let isCutscene = false
let cutsceneDone = false

const MAX_CHARGE = 100
const GRAVITY = 1000

// Checkpoint System
let checkpointX = 20
let checkpointY = 20

namespace SpriteKind {
    export const UI = SpriteKind.create()
    export const Platform = SpriteKind.create()
    export const Sign = SpriteKind.create()
    export const Coin = SpriteKind.create()
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

// --- ENEMIES ARRAY ---
let enemies: Sprite[] = []
let enemySpawnsX: number[] = []
let enemySpawnsY: number[] = []
let enemyMinX: number[] = []
let enemyMaxX: number[] = []

function createMonster(x: number, y: number, minX: number, maxX: number) {
    let m = sprites.create(img`
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
    `, SpriteKind.Enemy)
    m.ay = GRAVITY
    m.scale = 1.5
    m.setPosition(x, y)
    enemies.push(m)
    enemySpawnsX.push(x)
    enemySpawnsY.push(y)
    enemyMinX.push(minX)
    enemyMaxX.push(maxX)
}

// UI Meter
let meterSprite = sprites.create(image.create(52, 10), SpriteKind.UI)
meterSprite.setFlag(SpriteFlag.RelativeToCamera, true)
meterSprite.setPosition(80, 12)

function respawn() {
    player.setPosition(checkpointX, checkpointY)
    player.vx = 0; player.vy = 0
    charge = 0; isSlamming = false; isCharging = false; isCutscene = false

    // Reset all monsters to their exact starting points
    for (let i = 0; i < enemies.length; i++) {
        enemies[i].setPosition(enemySpawnsX[i], enemySpawnsY[i])
        enemies[i].vx = 0
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
    // Starting Stairs 
    createPlatform(0, 110, 80, 40)
    createPlatform(80, 95, 40, 60)
    createPlatform(120, 80, 40, 80)
    createPlatform(160, 65, 40, 100)
    createPlatform(200, 50, 60, 150)

    // First Cliff 
    createPlatform(260, -20, 100, 250)

    // Floating Mountain Climb 
    createPlatform(380, -50, 40, 10)
    createPlatform(440, -100, 40, 10)
    createPlatform(500, -150, 40, 10)

    // --- PHASE 2: Main Chase ---
    createPlatform(580, -180, 550, 400)
    createMonster(850, -200, 580, 1100)

    // Evasion Platforms & Coins
    createPlatform(750, -250, 40, 10); createCoin(750, -265)
    createPlatform(850, -300, 40, 10); createCoin(850, -315)
    createPlatform(950, -250, 40, 10); createCoin(950, -265)

    // THE POLE (Phase 2)
    createPlatform(1100, -250, 16, 70)

    // ESCAPE CLIFF 
    createPlatform(1130, -180, 150, 400)

    // --- PHASE 3: FLOATING GAUNTLET ---

    // Floating Platform 1
    createPlatform(1330, -250, 240, 20)
    createPlatform(1432, -320, 16, 70) // Pillar
    createMonster(1500, -270, 1448, 1570) // Monster on the right side of pillar

    // Floating Platform 2 (Steps up)
    createPlatform(1630, -320, 240, 20)
    createPlatform(1732, -390, 16, 70) // Pillar
    createMonster(1800, -340, 1748, 1870) // Monster on the right side of pillar

    // Floating Platform 3 (Steps up again)
    createPlatform(1930, -390, 240, 20)
    createPlatform(2032, -460, 16, 70) // Pillar
    createMonster(2100, -410, 2048, 2170) // Monster on the right side of pillar
}

buildWorld(); respawn()

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
            if (sprite.bottom >= p.top - 2 && sprite.bottom <= p.top + 8) return true
        }
    }
    return false
}

// --- CONTROLS ---
controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
    if (!isCutscene && checkIsGrounded(player) && !isCharging) player.vy = -240
})

controller.down.onEvent(ControllerButtonEvent.Pressed, function () {
    if (!isCutscene && !checkIsGrounded(player)) {
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

    // Player Collision 
    let currentlyOnPlat = false
    for (let p of sprites.allOfKind(SpriteKind.Platform)) {
        if (player.overlapsWith(p)) {
            if (player.vy >= 0 && player.bottom <= p.top + 10) {
                player.bottom = p.top; player.vy = 0; currentlyOnPlat = true
            } else {
                if (player.x < p.x) player.right = p.left; else player.left = p.right
            }
        }
    }

    // Dynamic AI & Hard Boundaries for ALL Enemies
    for (let i = 0; i < enemies.length; i++) {
        let m = enemies[i]

        // AI Chase Logic
        if (Math.abs(player.y - m.y) < 150 && Math.abs(player.x - m.x) < 250) {
            m.ax = (player.x > m.x) ? 140 : -140
        } else {
            m.ax = 0; m.vx *= 0.9
        }
        m.vx = Math.clamp(-70, 70, m.vx)

        // Map Boundaries
        if (m.left < enemyMinX[i]) {
            m.left = enemyMinX[i]; m.vx = 0
        }
        if (m.right > enemyMaxX[i]) {
            m.right = enemyMaxX[i]; m.vx = 0
        }

        // Monster Platform Collision
        for (let p of sprites.allOfKind(SpriteKind.Platform)) {
            if (m.overlapsWith(p)) {
                if (m.vy >= 0 && m.bottom <= p.top + 15) {
                    m.bottom = p.top; m.vy = 0
                } else {
                    if (m.x < p.x) { m.right = p.left; m.vx = 0 }
                    else { m.left = p.right; m.vx = 0 }
                }
            }
        }

        // Catch Condition
        if (player.overlapsWith(m)) respawn()
    }

    if (currentlyOnPlat) {
        if (isSlamming) {
            isSlamming = false; isCharging = true; scene.cameraShake(4, 200)
        } else if (!isCharging && !isCutscene) {
            controller.moveSprite(player, 100, 0)
        }
    }

    if (isCharging) charge = Math.min(MAX_CHARGE, charge + 5)
    if (player.y > 600) respawn()

    // UI Update
    meterSprite.image.fill(0); meterSprite.image.fillRect(0, 0, 52, 10, 15)
    meterSprite.image.fillRect(1, 1, 50, 8, 1); meterSprite.image.fillRect(1, 1, (charge / MAX_CHARGE) * 50, 8, 9)
})