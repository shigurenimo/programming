import { MonsterEntity } from "./domain/entities/monster-entity"
import { PlayerEntity } from "./domain/entities/player-entity"
import { HpValue } from "./domain/values/hp-value"

class BattleService {
  castFireball(player: PlayerEntity, monster: MonsterEntity) {
    const manaCost = 8
    const damage = 16

    const draftPlayer = player.consumeMp(manaCost)

    const draftMonster = monster.takeDamage(damage)

    return {
      player: draftPlayer,
      monster: draftMonster,
    }
  }
}

const player = new PlayerEntity({
  id: crypto.randomUUID(),
  hp: new HpValue(100),
  maxHp: new HpValue(100),
  mp: new HpValue(50),
  exp: 0,
  level: 1,
})

const monster = new MonsterEntity({
  id: crypto.randomUUID(),
  hp: new HpValue(80),
  maxHp: new HpValue(80),
  mp: new HpValue(20),
})

const battleService = new BattleService()

const result = battleService.castFireball(player, monster)

console.log(result.player)
