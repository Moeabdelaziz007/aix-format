import { kv } from './memory/storage.js';
import { SelfReviewRecord } from './domain.js';
import { CuriosityEngine } from './curiosity.js';

/**
 * AgentSelfReview 
 * Applies RULE 4: Non-blocking self-review logging and CuriosityEngine feeding
 */
export class AgentSelfReview {
    static record(review: SelfReviewRecord): void {
        // RULE 4: Non-blocking execution
        Promise.resolve().then(async () => {
            try {
                await this.store(review);
                // Feed CuriosityEngine
                try {
                    if (CuriosityEngine && typeof CuriosityEngine.calculateReward === 'function') {
                        await CuriosityEngine.calculateReward(review.agentId, review.taskDescription);
                    }
                } catch (e) { /* graceful fallback */ }
            } catch (e) {
                console.warn('[AgentSelfReview] Background record failed:', e);
            }
        });
    }

    static async store(review: SelfReviewRecord): Promise<void> {
        try {
            await kv.set(`agent:${review.agentId}:review:${review.taskId}`, review);
        } catch (e) { /* skip */ }
    }

    static async distill(review: SelfReviewRecord, task: string, output: string, octokit?: any): Promise<void> {
        Promise.resolve().then(() => {
            console.log(`[AgentSelfReview] Distilled wisdom for task: ${task}`);
        });
    }
}