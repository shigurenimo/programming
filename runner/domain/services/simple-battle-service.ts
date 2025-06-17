import { MonsterEntity } from "../entities/monster-entity"
import { PlayerEntity } from "../entities/player-entity"
import { HpValue } from "../values/hp-value"

class SimpleBattleService {
  castSpell(playerEntity: PlayerEntity, monsterEntity: MonsterEntity) {
    const draftPlayer = playerEntity.consumeMp(4)

    const draftMonster = monsterEntity.takeDamage(16)

    return {
      player: draftPlayer,
      monster: draftMonster,
    }
  }
}

const playerEntity = new PlayerEntity({
  id: crypto.randomUUID(),
  hp: new HpValue(128),
  mp: new HpValue(64),
  maxHp: new HpValue(128),
  exp: 0,
  level: 1,
})

const monsterEntity = new MonsterEntity({
  id: crypto.randomUUID(),
  hp: new HpValue(64),
  mp: new HpValue(16),
  maxHp: new HpValue(64),
})

const battleService = new SimpleBattleService()

const result = battleService.castSpell(playerEntity, monsterEntity)

console.log("result", result.monster.hp.value) // 48
