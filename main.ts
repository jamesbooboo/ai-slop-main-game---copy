// --- 1. SET UP KINDS ---
namespace SpriteKind {
    export const UI = SpriteKind.create()
    export const Shockwave = SpriteKind.create()
    export const Upgrade = SpriteKind.create()
    export const Boss = SpriteKind.create()
    export const Platform = SpriteKind.create()
    export const Coin = SpriteKind.create()
    export const Blockade = SpriteKind.create()
    export const Hazard = SpriteKind.create()    // For the Water
    export const Decoration = SpriteKind.create() // For Background Mountains
}

// --- 2. GLOBAL VARIABLES & CONSTANTS ---
const GROUND_Y = 110
const MAX_CHARGE = 100
const GRAVITY = 1000

let charge = 0
let isSlamming = false
let isCharging = false
let hasShockwave = false
let bossHP = 5
let spawnX = 20
let coins = 0

scene.setBackgroundColor(9) // Sky Blue

// --- 3. PLAYER SETUP ---
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

// UI Meter
let meterImg = image.create(52, 10)
let meterSprite = sprites.create(meterImg, SpriteKind.UI)
meterSprite.setFlag(SpriteFlag.RelativeToCamera, true)
meterSprite.setPosition(80, 12)
meterSprite.z = 100

function respawnPlayer() {
    player.setPosition(spawnX, 20)
    player.vx = 0
    player.vy = 0
    charge = 0
    isSlamming = false
    isCharging = false
    controller.moveSprite(player, 100, 0)
}

// --- 4. WORLD BUILDING ---
function createPlatform(x: number, y: number, width: number, height: number, color: number = 14) {
    let platImg = image.create(width, height)
    platImg.fill(color)
    // Add grass if it's a standard dirt platform
    if (color == 14) {
        platImg.fillRect(0, 0, width, 4, 7)
        platImg.fillRect(0, 4, width, 1, 6)
    }
    let plat = sprites.create(platImg, SpriteKind.Platform)
    plat.left = x
    plat.top = y
    return plat
}

function buildLevel() {
    // Background Scenery (Mountains)
    for (let i = 0; i < 10; i++) {
        let mtn = sprites.create(img`
            . . . . . . . . . . . . . . . . 
            . . . . . . . f f f . . . . . . 
            . . . . . . f f f f f . . . . . 
            . . . . . f f f f f f f . . . . 
            . . . . f f f f f f f f f . . . 
            . . . f f f f f f f f f f f . . 
            . . f f f f f f f f f f f f f . 
        `, SpriteKind.Decoration)
        mtn.setPosition(i * 180, 90)
        mtn.scale = 8
        mtn.z = -10
    }

    // THE STAIRS (3 doable jumps)
    createPlatform(0, GROUND_Y, 80, 40)   // Start
    createPlatform(100, 95, 40, 60)       // Stair 1
    createPlatform(160, 80, 40, 80)       // Stair 2
    createPlatform(220, 65, 40, 100)      // Stair 3 (Final Prep)

    // THE PIT (Water Hazard)
    let water = sprites.create(image.create(250, 20), SpriteKind.Hazard)
    water.image.fill(6)
    water.left = 260
    water.top = 115

    // THE TALL MOUNTAIN (Only the top is visible)
    // Positioned so only a Charge Jump can reach it
    createPlatform(520, 25, 80, 200, 13) // Grey Rock Peak

    // Phase 2 Entry
    createPlatform(680, 110, 400, 40)

    // Coin on the peak
    let coinImg = img`. 5 5 . 5 f 5 . 5 5 .`
    sprites.create(coinImg, SpriteKind.Coin).setPosition(560, 10)
}

buildLevel()
respawnPlayer()

// --- 5. PHYSICS & CONTROLS ---
function checkIsGrounded(): boolean {
    for (let p of sprites.allOfKind(SpriteKind.Platform)) {
        if (player.right > p.left && player.left < p.right) {
            if (player.bottom >= p.top - 2 && player.bottom <= p.top + 8) return true
        }
    }
    return false
}

controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
    if (checkIsGrounded() && !isCharging) {
        player.vy = -240 // Base Jump
    }
})

controller.down.onEvent(ControllerButtonEvent.Pressed, function () {
    if (!checkIsGrounded()) {
        isSlamming = true
        player.vy = 800
        controller.moveSprite(player, 0, 0)
    }
})

controller.down.onEvent(ControllerButtonEvent.Released, function () {
    if (isCharging) {
        player.vy = -350 - (500 * (charge / MAX_CHARGE))
        isCharging = false; charge = 0; controller.moveSprite(player, 100, 0)
    } else if (isSlamming) {
        isSlamming = false; controller.moveSprite(player, 100, 0)
    }
})

// --- 6. GAME LOOP ---
game.onUpdate(function () {
    // Fixed Camera logic
    scene.centerCameraAt(player.x + 30, 60)

    // Collision Logic
    let onFloor = false
    for (let s of sprites.allOfKind(SpriteKind.Platform)) {
        if (player.overlapsWith(s)) {
            if (player.vy >= 0 && player.bottom <= s.top + 12) {
                player.bottom = s.top; player.vy = 0; onFloor = true
            } else {
                if (player.x < s.x) player.right = s.left; else player.left = s.right
            }
        }
    }

    if (onFloor) {
        if (isSlamming) {
            isSlamming = false; isCharging = true; scene.cameraShake(4, 200)
        } else if (!isCharging) {
            controller.moveSprite(player, 100, 0)
        }
    }

    if (isCharging) charge = Math.min(MAX_CHARGE, charge + 5)

    // Hazard Check
    for (let h of sprites.allOfKind(SpriteKind.Hazard)) {
        if (player.overlapsWith(h)) {
            game.splash("Watch out for the water!")
            respawnPlayer()
        }
    }

    if (player.y > 200) respawnPlayer()

    // UI Update
    meterSprite.image.fill(0); meterSprite.image.fillRect(0, 0, 52, 10, 15)
    meterSprite.image.fillRect(1, 1, 50, 8, 1)
    meterSprite.image.fillRect(1, 1, (charge / MAX_CHARGE) * 50, 8, 9)
    meterSprite.image.print("C:" + coins, 2, 2, 15)
})

sprites.onOverlap(SpriteKind.Player, SpriteKind.Coin, (p, c) => { coins++; c.destroy() })