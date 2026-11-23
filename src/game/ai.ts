import { FighterInstance } from './fighters';
import { Difficulty, PlayerInputState } from './types';

export class FighterAiController {
  private decisionTimer = 0;
  private desiredMoveX = 0;
  private desiredMoveZ = 0;
  private wantBlock = false;
  private blockHoldTimer = 0;
  private comboPending = 0;

  public reset(): void {
    this.decisionTimer = 0.15;
    this.desiredMoveX = 0;
    this.desiredMoveZ = 0;
    this.wantBlock = false;
    this.blockHoldTimer = 0;
    this.comboPending = 0;
  }

  public update(
    ai: FighterInstance,
    opponent: FighterInstance,
    difficulty: Difficulty,
    dt: number,
    arcadeLevel = 1,
  ): PlayerInputState {
    const out: PlayerInputState = {
      moveX: 0,
      moveZ: 0,
      block: false,
      jumpPressed: false,
      punchPressed: false,
      kickPressed: false,
      specialPressed: false,
    };

    const dx = opponent.x - ai.x;
    const dist = Math.abs(dx);
    const dirToOpp = dx >= 0 ? 1 : -1;

    // Combine base difficulty with 1..100 progressive level scaling
    const baseFactor = difficulty === 'rookie' ? 0.1 : difficulty === 'challenger' ? 0.45 : 0.8;
    const levelProgress = Math.min(1, Math.max(0, (arcadeLevel - 1) / 99));
    const skill = Math.min(1, Math.max(baseFactor, baseFactor * 0.45 + levelProgress * 0.92));

    const reactSpeed = 0.42 - skill * 0.34; // 0.42s down to 0.08s
    const blockChance = 0.15 + skill * 0.72; // 15% up to 87%
    const aggression = 0.38 + skill * 0.58; // 38% up to 96%

    // Continue queued combo chain
    if (this.comboPending > 0 && (ai.action === 'punch_1' || ai.action === 'punch_2')) {
      if (ai.actionTimer > 0.15) {
        out.punchPressed = true;
        this.comboPending--;
      }
    }

    if (this.blockHoldTimer > 0) {
      this.blockHoldTimer -= dt;
    } else {
      this.wantBlock = false;
    }

    // Reactive defense when opponent strikes nearby
    const oppAttacking =
      opponent.action === 'punch_1' ||
      opponent.action === 'punch_2' ||
      opponent.action === 'punch_3' ||
      opponent.action === 'kick' ||
      opponent.action === 'special';

    if (oppAttacking && dist < 2.95 && this.decisionTimer <= 0.06) {
      if (Math.random() < blockChance) {
        this.wantBlock = true;
        this.blockHoldTimer = 0.28 + skill * 0.14;
      }
    }

    this.decisionTimer -= dt;
    if (this.decisionTimer <= 0) {
      this.decisionTimer = reactSpeed * (0.75 + Math.random() * 0.5);

      const dz = opponent.z - ai.z;
      this.desiredMoveZ =
        Math.abs(dz) > 0.35
          ? Math.sign(dz) * (0.55 + skill * 0.35)
          : (Math.random() - 0.5) * (0.3 + skill * 0.4);

      if (this.wantBlock) {
        this.desiredMoveX = 0;
      } else if (dist > 2.35) {
        this.desiredMoveX = dirToOpp;
        if (Math.random() < 0.1 + skill * 0.12 && ai.grounded) {
          out.jumpPressed = true;
        }
      } else if (dist < 1.1) {
        this.desiredMoveX = Math.random() < 0.35 ? -dirToOpp * 0.85 : 0;
      } else {
        this.desiredMoveX = Math.random() < 0.45 ? dirToOpp * 0.55 : 0;
      }

      if (!this.wantBlock && dist <= 3.15 && Math.random() < aggression) {
        if (ai.energy >= 100 && dist <= 3.15 && Math.random() < 0.25 + skill * 0.55) {
          out.specialPressed = true;
        } else if (dist <= 2.35) {
          const roll = Math.random();
          if (roll < 0.5) {
            out.punchPressed = true;
            if (Math.random() < 0.35 + skill * 0.55) {
              this.comboPending = skill > 0.45 ? 2 : 1;
            }
          } else if (roll < 0.84) {
            out.kickPressed = true;
          } else if (ai.grounded && Math.random() < 0.24) {
            out.jumpPressed = true;
          }
        }
      }
    }

    out.moveX = this.wantBlock ? 0 : this.desiredMoveX;
    out.moveZ = this.wantBlock ? 0 : this.desiredMoveZ;
    out.block = this.wantBlock;

    return out;
  }
}
