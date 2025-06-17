import z from "zod/v4"
import { MonsterEntity } from "./monster-entity"
import { PlayerEntity } from "./player-entity"

const zProps = z.object({
  id: z.string(),
  player: z.instanceof(PlayerEntity),
  monster: z.instanceof(MonsterEntity),
  turn: z.number().nonnegative(),
  isFinished: z.boolean(),
})

type Props = z.infer<typeof zProps>

export class BattleEntity implements Props {
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
