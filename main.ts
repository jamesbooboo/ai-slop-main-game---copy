let charge = 0
let isSlamming = false
let isCharging = false
let isCutscene = false
let cutsceneDone = false
let spawnX = 20

const MAX_CHARGE = 100
const GRAVITY = 1000

// Fixed Namespace: Removed 'Enemy' because it's built-in
namespace SpriteKind {
    export const UI = SpriteKind.create()
    export const Platform = SpriteKind.create()
    export const Sign = SpriteKind.create()
}

scene.setBackgroundColor(6) // Teal/Blue sky color

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

// --- MONSTER ---
let monster = sprites.create(img`
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
`, SpriteKind.Enemy) // Using built-in SpriteKind.Enemy
monster.ay = GRAVITY
monster.scale = 1.5

// UI Meter
let meterSprite = sprites.create(image.create(52, 10), SpriteKind.UI)
meterSprite.setFlag(SpriteFlag.RelativeToCamera, true)
meterSprite.setPosition(80, 12)

function respawnPlayer() {
    player.setPosition(spawnX, 20)
    player.vx = 0; player.vy = 0
    charge = 0; isSlamming = false; isCharging = false; isCutscene = false
    controller.moveSprite(player, 100, 0)
}

function createPlatform(x: number, y: number, width: number, height: number) {
    let platImg = image.create(width, height)
    platImg.fill(13) // Tan/Rock color like your image
    let plat = sprites.create(platImg, SpriteKind.Platform)
    plat.left = x; plat.top = y
    return plat
}

function buildWorld() {
    // Starting Stairs
    createPlatform(0, 110, 80, 40)
    createPlatform(80, 95, 40, 60)
    createPlatform(120, 80, 40, 80)
    createPlatform(160, 65, 40, 100)
    createPlatform(200, 50, 60, 150)

    // First Cliff (Now reachable)
    createPlatform(260, -20, 100, 250)

    // Floating Mountain Climb 
    createPlatform(380, -50, 40, 10)
    createPlatform(440, -100, 40, 10)
    createPlatform(500, -150, 40, 10)

    // PHASE 2: Long Monster Platform
    createPlatform(580, -180, 600, 400)

    // THE LONG POLE & ESCAPE CLIFF
    // The pole is a thin vertical wall that stops the monster
    createPlatform(1180, -350, 10, 250)
    createPlatform(1190, -350, 300, 400)

    monster.setPosition(850, -200)
}

buildWorld(); respawnPlayer()

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

// --- MAIN LOOP ---
let camY = 60
game.onUpdate(function () {
    let targetCamY = player.y - 20
    if (isCutscene) targetCamY = -50

    camY = (camY * 15 + targetCamY) / 16
    scene.centerCameraAt(player.x + 40, camY)

    if (player.x > 210 && player.x < 240 && !cutsceneDone) startCliffCutscene()

    // Player Collision
    let currentlyOnPlat = false
    for (let p of sprites.allOfKind(SpriteKind.Platform)) {
        if (player.overlapsWith(p)) {
            if (player.vy >= 0 && player.bottom <= p.top + 15) {
                player.bottom = p.top; player.vy = 0; currentlyOnPlat = true
            } else {
                if (player.x < p.x) player.right = p.left; else player.left = p.right
            }
        }
    }

    // Monster AI with Acceleration (Physics-based)
    if (Math.abs(player.y - monster.y) < 150) {
        monster.ax = (player.x > monster.x) ? 140 : -140
    } else {
        monster.ax = 0; monster.vx *= 0.9
    }
    monster.vx = Math.clamp(-70, 70, monster.vx)

    // Monster Collision & Gravity
    for (let p of sprites.allOfKind(SpriteKind.Platform)) {
        if (monster.overlapsWith(p)) {
            if (monster.vy >= 0 && monster.bottom <= p.top + 15) {
                monster.bottom = p.top; monster.vy = 0
            } else {
                if (monster.x < p.x) { monster.right = p.left; monster.vx = 0 }
                else { monster.left = p.right; monster.vx = 0 }
            }
        }
    }

    if (currentlyOnPlat) {
        if (isSlamming) {
            isSlamming = false; isCharging = true; scene.cameraShake(4, 200)
        } else if (!isCharging && !isCutscene) {
            controller.moveSprite(player, 100, 0)
        }
    }

    if (isCharging) charge = Math.min(MAX_CHARGE, charge + 5)
    if (player.y > 600) respawnPlayer()
    if (player.overlapsWith(monster)) respawnPlayer()

    // UI Update
    meterSprite.image.fill(0); meterSprite.image.fillRect(0, 0, 52, 10, 15)
    meterSprite.image.fillRect(1, 1, 50, 8, 1); meterSprite.image.fillRect(1, 1, (charge / MAX_CHARGE) * 50, 8, 9)
})