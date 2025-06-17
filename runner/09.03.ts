import { PlayerEntity } from "./domain/entities/player-entity"
import { ExpEngine } from "./domain/modules/exp-engine"

class LevelingService {
  constructor(private expEngine: ExpEngine) {}

  addExp(player: PlayerEntity, gainedExp: number): PlayerEntity {
    const newExp = player.exp + gainedExp

    const newLevel = this.expEngine.calculateLevel(newExp)

    return player.withExp(newExp).withLevel(newLevel)
  }
}

const service = new LevelingService(new ExpEngine())

const draft = service.addExp(PlayerEntity.create(), 1028)

console.log("level", draft.level) // 3
