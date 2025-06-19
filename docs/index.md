# TypeScript

## 00.オブジェクト

最初に基本的なオブジェクトを定義します。

```ts
type Monster = {
  name: string
  hp: number
  mp: number
}

const monster: Monster = {
  name: "slime",
  hp: 16,
  mp: 8
}
```

型の定義により、オブジェクトの構造が明確になります。この段階では、プロパティの直接変更が可能です。

## 01.イミュータブル

魔法を唱えることでMPを消費してHPを回復させる処理を実装します。

```ts
type Monster = {
  name: string
  hp: number
  mp: number
}

const monster: Monster = {
  name: "slime",
  hp: 16,
  mp: 8
}

monster.hp += 16 // 32
monster.mp -= 8 // 0

console.log(monster.hp) // 32
```

この実装では、オブジェクトの値が自由に変更されてしまいます。予期しない副作用を防ぐため、オブジェクトの変更を制限する必要があります。

更に`Object.freeze`を使用してオブジェクトの書き換えを防止します。

```ts
type Monster = {
  name: string
  hp: number
  isDead: boolean
}

const monster: Monster = Object.freeze({
  name: "slime",
  hp: 16,
  isDead: false,
})

monster.hp -= 999 // TypeError: Cannot assign to read only property
```

値を変更する代わりに、新しいオブジェクトを作成する方法を採用します。

```ts
type Monster = {
  name: string
  hp: number
  mp: number
}

const monster: Monster = Object.freeze({
  name: "slime",
  hp: 16,
  mp: 8,
})

const draftMonster = {
  ...monster,
  hp: monster.hp + 16, // 回復
  mp: monster.mp - 8, // 消費
}

console.log(draftMonster.hp) // 32
console.log(monster.hp) // 16（元の値は保持される）
```

この方法により、元のオブジェクトは変更されず、状態変更の履歴が追跡可能になります。

## 02.ビジネスルールの導入

ゲームのルールを実装します。

- モンスターのHPは0未満になってはいけない
- HPが0になった場合、そのモンスターは死亡状態とする

これらのルールを関数として表現します。

```ts
type Monster = {
  name: string
  hp: number
  mp: number
}

function castSpell(monster: Monster): Monster {
  return {
    ...monster,
    hp: monster.hp + 16, // 回復
    mp: monster.mp - 8, // 消費
  }
}

function takeDamage(monster: Monster, value: number): Monster {
  return {
    ...monster,
    hp: Math.max(monster.hp - value, 0), // 0未満にならないよう制限
  }
}

const monster: Monster = Object.freeze({
  name: "slime",
  hp: 16,
  mp: 8,
})

const healedMonster = castSpell(monster)
const damagedMonster = takeDamage(monster, 28)
```

関数を使用することで、ビジネスルールが明示的に表現され、再利用可能になります。

## 03.クラス

関連する状態と振る舞いを一つの単位として扱うため、クラスを使用します。クラスは関数の糖衣構文として機能し、メソッドチェーンによるFluentなAPIを提供します。

```ts
type Props = {
  name: string
  hp: number
  mp: number
}

class Monster implements Props {
  readonly name!: string
  readonly hp!: number
  readonly mp!: number

  constructor(props: Props) {
    Object.assign(this, props)
    Object.freeze(this) // 書き換えを禁止
  }

  castSpell() {
    return new Monster({
      ...this,
      hp: this.hp + 16, // 回復
      mp: this.mp - 8, // 消費
    })
  }

  takeDamage(value: number) {
    return new Monster({
      ...this,
      hp: Math.max(this.hp - value, 0),
    })
  }
}

const monster = new Monster({
  name: "slime",
  hp: 16,
  mp: 8,
})
  .castSpell() // hp: 32, mp: 0
  .takeDamage(28) // hp: 4, mp: 0
```

ビジネスルールを含みながら概念を表現するオブジェクトをEntityと呼びます。各メソッドは新しいインスタンスを返すため、イミュータブルな性質が保たれます。

## 04.状態の表現

オブジェクトの状態を判定するためのプロパティを定義します。Getterを使用して、状態判定のロジックを一箇所に集約します。

```ts
type Props = {
  hp: number
}

class Monster implements Props {
  readonly hp!: number

  constructor(props: Props) {
    Object.assign(this, props)
    Object.freeze(this)
  }

  takeDamage(value: number) {
    return new Monster({
      ...this,
      hp: Math.max(this.hp - value, 0),
    })
  }

  get isDead() {
    return this.hp === 0
  }
}

const monster = new Monster({ hp: 16 })
  .takeDamage(12)
  .takeDamage(12)

console.log(monster.isDead) // true
```

状態判定ロジックがGetterに集約されることで、ルール変更時の影響範囲が限定されます。

## 05.値オブジェクト

より複雑なルールを実装する場合を考えます。

- HPの最大値は999
- 回復は最大値を超えない
- ダメージによりHPが0未満になることはない

ライブラリ「Zod」を使用して値の検証を行います。

```ts
import { z } from "zod/v4"

const zProps = z.object({
  hp: z.number().min(0).max(999),
  mp: z.number().min(0).max(999),
  maxHp: z.number().min(1).max(999),
})

type Props = z.infer<typeof zProps>

class Monster implements Props {
  readonly hp!: Props['hp']
  readonly mp!: Props['mp']
  readonly maxHp!: Props['maxHp']

  constructor(props: Props) {
    Object.assign(this, zProps.parse(props))
    Object.freeze(this)
    if (this.maxHp < this.hp) {
      throw new Error(`HP cannot exceed maxHp: ${this.maxHp}`)
    }
  }

  castHeal() {
    return new Monster({
      ...this,
      hp: Math.min(this.hp + 16, this.maxHp), // 最大値制限
      mp: this.mp - 8,
    })
  }
}
```

ルールが増加するとEntityが複雑になります。値オブジェクトを使用してルールを分離します。

```ts
import { z } from "zod/v4"

const zValue = z.number().min(0).max(999)
type Value = z.infer<typeof zValue>

class HpValue {
  readonly value: Value

  constructor(value: Value) {
    this.value = zValue.parse(value)
  }

  /**
   * 上限制限
   */
  add(value: number): HpValue {
    return new HpValue(Math.min(this.value + value, 999))
  }

  /**
   * 下限制限
   */
  subtract(value: number): HpValue {
    return new HpValue(Math.max(this.value - value, 0))
  }

  get isZero(): boolean {
    return this.value === 0
  }
}
```

値オブジェクトは値そのものと、その値に対する操作を表現します。すべての計算ルールが値オブジェクト内に集約されるため、Entityは値の計算方法を意識する必要がありません。

Entityと値オブジェクトを組み合わせます。

```ts
import { z } from "zod"
import { HpValue } from "./domain/values/hp-value"

const zProps = z.object({
  hp: z.instanceof(HpValue),
  mp: z.instanceof(HpValue),
  maxHp: z.instanceof(HpValue),
  name: z.string().min(1).max(8),
})

type Props = z.infer<typeof zProps>

class Monster implements Props {
  readonly hp!: Props["hp"]
  readonly mp!: Props["mp"]
  readonly maxHp!: Props["maxHp"]
  readonly name!: Props["name"]

  constructor(props: Props) {
    Object.assign(this, zProps.parse(props))
    Object.freeze(this)
    if (this.maxHp.value < this.hp.value) {
      throw new Error(`HP cannot exceed maxHp: ${this.maxHp.value}`)
    }
  }

  castHeal(): Monster {
    return new Monster({
      ...this,
      hp: this.hp.add(16),
      mp: this.mp.subtract(8),
    })
  }

  takeDamage(value: number): Monster {
    return new Monster({
      ...this,
      hp: this.hp.subtract(value),
    })
  }

  get isDead(): boolean {
    return this.hp.isZero
  }
}

const monster = new Monster({
  hp: new HpValue(16),
  mp: new HpValue(8),
  maxHp: new HpValue(32),
  name: "slime",
})

const draft = monster.castHeal().takeDamage(128)

console.log("isDead", draft.isDead) // true
```

Entityは値の計算詳細を知る必要がなくなり、ビジネスロジックに集中できます。

## 06.ファクトリーパターン

Entityの生成が複雑になった場合、ファクトリーパターンを使用して生成ロジックを分離します。

小規模なアプリケーションでは、Entityにstaticメソッドを追加します。

```ts
class MonsterEntity {
  // 既存のコード...

  static create() {
    return new MonsterEntity({
      id: crypto.randomUUID(),
      hp: new HpValue(16),
      mp: new HpValue(8),
      maxHp: new HpValue(16),
    })
  }

  static createFromLevel(level: number) {
    const baseHp = level * 10
    return new MonsterEntity({
      id: crypto.randomUUID(),
      hp: new HpValue(baseHp),
      mp: new HpValue(level * 5),
      maxHp: new HpValue(baseHp),
    })
  }
}

const slime = MonsterEntity.create()

const dragon = MonsterEntity.createFromLevel(10)
```

より複雑な生成ロジックには、専用のファクトリークラスを作成します。

```ts
import { HpValue } from "./domain/values/hp-value"
import { MonsterEntity } from "./domain/entities/monster-entity"

class MonsterFactory {
  create(type: string, level: number): MonsterEntity {
    if (type === "slime") {
      return new MonsterEntity({
        id: crypto.randomUUID(),
        hp: new HpValue(level * 8),
        maxHp: new HpValue(level * 8),
        mp: new HpValue(level * 4),
      })
    }

    if (type === "dragon") {
      return new MonsterEntity({
        id: crypto.randomUUID(),
        hp: new HpValue(level * 20),
        maxHp: new HpValue(level * 20),
        mp: new HpValue(level * 15),
      })
    }

    throw new Error(`Unknown monster type: ${type}`)
  }
}

const factory = new MonsterFactory()

const slime = factory.create("slime", 4)

console.log(slime.hp.value) // 16
```

ファクトリーパターンにより、複雑な生成ロジックがEntityから分離され、コードの可読性が向上します。

## 07.複数Entityの操作

プレイヤーとモンスターを同時に更新する場合を考えます。プレイヤーがMPを消費してモンスターにダメージを与える処理を実装します。

プレイヤーEntityを定義します。

```ts
const zProps = z.object({
  id: z.string(),
  hp: z.instanceof(HpValue),
  mp: z.instanceof(HpValue),
})

type Props = z.infer<typeof zProps>

export class PlayerEntity implements Props {
  readonly id!: Props["id"]

  readonly hp!: Props["hp"]

  readonly mp!: Props["mp"]

  constructor(props: Props) {
    Object.assign(this, zProps.parse(props))
    Object.freeze(this)
  }

  takeDamage(value: number) {
    return new PlayerEntity({
      ...this,
      hp: this.hp.subtract(value),
    })
  }

  consumeMp(value: number) {
    return new PlayerEntity({
      ...this,
      mp: this.mp.subtract(value),
    })
  }
}

const player = new PlayerEntity({
  id: crypto.randomUUID(),
  hp: new HpValue(100),
  mp: new HpValue(50),
})

const draft = player.takeDamage(20).consumeMp(10)

console.log("draft", draft.hp.value, draft.mp.value) // 80, 40
```

複数のEntityにまたがる操作にはドメインサービスを使用します。

```ts
import { MonsterEntity } from "./domain/entities/simple-monster-entity"
import { PlayerEntity } from "./domain/entities/simple-player-entity"
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
  mp: new HpValue(50),
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
```

ドメインサービスは、単一のEntityでは表現できないビジネスロジックを担当します。

## 08.集約

戦闘そのものが状態を持つ場合、集約として表現します。永続化が必要なオブジェクトは集約として扱います。

```ts
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
```

使用例：

```ts
const battleEntity = new BattleEntity({
  id: crypto.randomUUID(),
  player: new PlayerEntity({
    id: crypto.randomUUID(),
    hp: new HpValue(100),
    maxHp: new HpValue(100),
    mp: new HpValue(50),
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
```

集約は、データの整合性を保つ境界として機能します。集約を通じてのみ内部のEntityを操作することで、ビジネスルールの適用が保証されます。

## 09.クラスをシンプルに保つ

Entityが複雑になってきた場合、責務を分離することでシンプルに保ちます。経験値計算を例に説明します。

これは、すべてをEntityに詰め込んだ例です。

```ts
type Props = {
  id: string
  exp: number
  level: number
}

class PlayerEntity {
  readonly id!: string
  readonly exp!: number
  readonly level!: number

  constructor(props: Props) {
    Object.assign(this, props)
    Object.freeze(this)
  }

  addExp(value: number): PlayerEntity {
    const newExp = this.exp + value

    // レベル計算がEntity内に埋め込まれている
    let newLevel = 1
    let requiredExp = 0

    while (requiredExp <= newExp) {
      newLevel++
      requiredExp = newLevel * newLevel * 100
    }

    return new PlayerEntity({
      ...this,
      exp: newExp,
      level: newLevel - 1,
    })
  }
}

const playerEntity = new PlayerEntity({
  id: crypto.randomUUID(),
  exp: 0,
  level: 1,
})

const draft = playerEntity.addExp(1028)

console.log("level", draft.level) // 4
```

経験値計算を専用のクラスに分離します。

```ts
class ExpEngine {
  calculateLevel(exp: number): number {
    let level = 1
    while (this.calculateRequiredExp(level) <= exp) {
      level++
    }
    return level - 1
  }

  calculateRequiredExp(level: number): number {
    return level * level * 100
  }
}

const expEngine = new ExpEngine()

const playerExp = 1028

const playerLevel = expEngine.calculateLevel(playerExp)

console.log("level", playerLevel) // 3
```

ドメインサービスで経験値エンジンを使用します。

```ts
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
```

## 10.Union型による種類の表現

複数の種類を持つオブジェクトを表現する場合、Union型を使用します。

単一クラスでの実装例:

```ts
import { z } from "zod/v4"

const zProps = z.object({
  name: z.string(),
  cost: z.number().min(0).max(999),
  value: z.number().min(0).max(999),
  type: z.enum(['ATTACK', 'HEAL', 'BUFF', 'DEBUFF']),
  duration: z.number().min(0).max(999).nullable(),
})

type Props = z.infer<typeof zProps>

export class SpellValue implements Props {
  readonly name!: Props["name"]
  readonly cost!: Props["cost"]
  readonly value!: Props["value"]
  readonly type!: Props["type"]
  readonly duration!: Props["duration"]

  constructor(props: Props) {
    Object.assign(this, zProps.parse(props))
    Object.freeze(this)
    
    if (this.type === 'ATTACK' && this.duration !== null) {
      throw new Error("Attack spells cannot have a duration")
    }
  }
}
```

この実装では、constructorでの場合分けが複雑になります。

種類ごとにクラスを分離した実装：

```ts
import { z } from "zod/v4"


const zAttackSpellProps = z.object({
  name: z.string(),
  cost: z.number().min(0).max(999),
  damage: z.number().min(1).max(999),
})

export class AttackSpell {
  readonly name!: string
  readonly cost!: number
  readonly damage!: number

  constructor(props: z.infer<typeof zAttackSpellProps>) {
    Object.assign(this, zAttackSpellProps.parse(props))
    Object.freeze(this)
  }
}

const zHealSpellProps = z.object({
  name: z.string(),
  cost: z.number().min(0).max(999),
  healAmount: z.number().min(1).max(999),
})

class HealSpell {
  readonly name!: string
  readonly cost!: number
  readonly healAmount!: number

  constructor(props: z.infer<typeof zHealSpellProps>) {
    Object.assign(this, zHealSpellProps.parse(props))
    Object.freeze(this)
  }
}

const zBuffSpellProps = z.object({
  name: z.string(),
  cost: z.number().min(0).max(999),
  effect: z.string(),
  duration: z.number().min(1).max(10),
})

class BuffSpell {
  readonly name!: string
  readonly cost!: number
  readonly effect!: string
  readonly duration!: number

  constructor(props: z.infer<typeof zBuffSpellProps>) {
    Object.assign(this, zBuffSpellProps.parse(props))
    Object.freeze(this)
  }
}
```

Union型でこれらの種類をまとめます：

```ts
type SpellValue = AttackSpellValue | HealSpellValue | BuffSpellValue

class BattleService {
  castSpell(props: {
    spell: SpellValue
    caster: PlayerEntity
    target: MonsterEntity | null
  }) {
    if (props.spell instanceof AttackSpellValue) {
      return {
        caster: props.caster.consumeMp(props.spell.cost),
        target: props.target?.takeDamage(props.spell.damage),
      }
    }

    if (props.spell instanceof HealSpellValue) {
      return {
        caster: props.caster
          .consumeMp(props.spell.cost)
          .addHp(props.spell.healAmount),
        target: props.target,
      }
    }

    throw new Error("Unsupported spell type")
  }
}

const service = new BattleService()

const result = service.castSpell({
  spell: new AttackSpellValue({
    name: "Fireball",
    cost: 10,
    damage: 30,
  }),
  caster: PlayerEntity.create(),
  target: MonsterEntity.createFromLevel(1),
})

console.log("result", result)
```

Union型により、TypeScriptの型システムが各種類を適切に識別し、型安全性が保たれます。新しい種類を追加した際の対応漏れもコンパイル時に検出できます。
