import type { MonsterEntity } from "../entities/monster-entity"
import type { PlayerEntity } from "../entities/player-entity"
import type { SimpleSpellValue } from "../values/simple-spell-value"

export class BattleService {
  castSimpleSpell(props: {
    playerEntity: PlayerEntity
    monsterEntity: MonsterEntity
    spell: SimpleSpellValue
  }) {
    const draftPlayer = props.playerEntity.consumeMp(props.spell.cost)

    const draftMonster = props.monsterEntity.takeDamage(props.spell.value)

    return {
      player: draftPlayer,
      monster: draftMonster,
    }
  }
}
