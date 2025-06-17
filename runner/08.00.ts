import { z } from "zod/v4"
import { MonsterEntity } from "./domain/entities/monster-entity"
import { PlayerEntity } from "./domain/entities/player-entity"
import { HpValue } from "./domain/values/hp-value"

const zProps = z.object({
  id: z.string(),
  player: z.instanceof(PlayerEntity),
  monster: z.instanceof(MonsterEntity),
  turn: z.number().nonnegative(),
  isFinished: z.boolean(),
})

type Props = z.infer<typeof zProps>

class BattleEntity implements Props {
  readonly id!: Props["id"]
  readonly player!: Props["player"]
  readonly monster!: Props["monster"]
  readonly turn!: Props["turn"]
  readonly isFinished!: Props["isFinished"]

  constructor(props: Props) {
    Object.assign(this, zProps.parse(props))
    Object.freeze(this)
  }

  castFireball(): BattleEntity {
    if (this.isFinished) {
      throw new Error("戦闘が既に終了しています")
    }

    const draftPlayer = this.player.consumeMp(8)

    const draftMonster = this.monster.takeDamage(16)

    return new BattleEntity({
      ...this,
      player: draftPlayer,
      monster: draftMonster,
    })
  }

  nextTurn(): BattleEntity {
    const isFinished = this.player.isDead || this.monster.isDead

    return new BattleEntity({
      ...this,
      turn: this.turn + 1,
      isFinished,
    })
  }
}

const battleEntity = new BattleEntity({
  id: crypto.randomUUID(),
  player: new PlayerEntity({
    id: crypto.randomUUID(),
    hp: new HpValue(100),
    maxHp: new HpValue(100),
    mp: new HpValue(50),
    exp: 0,
    level: 1,
  }),
  monster: new MonsterEntity({
    id: crypto.randomUUID(),
    hp: new HpValue(32),
    maxHp: new HpValue(32),
    mp: new HpValue(0),
  }),
  turn: 0,
  isFinished: false,
})

const draft = battleEntity.castFireball().nextTurn().castFireball().nextTurn()

console.log("Draft Player HP:", draft.player.hp.value)
