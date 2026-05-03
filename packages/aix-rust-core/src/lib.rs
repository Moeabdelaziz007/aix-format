mod event_store;
mod skill_cache;
mod trust_chain;

use event_store::{BusEvent, EventStore};
use neon::prelude::*;
use skill_cache::{Skill, SkillCache, SkillKind};
use std::sync::OnceLock;
use trust_chain::TrustChain;

// Global singletons (Gem 7 - fearless concurrency)
static EVENT_STORE: OnceLock<EventStore> = OnceLock::new();
static SKILL_CACHE: OnceLock<SkillCache> = OnceLock::new();
static TRUST_CHAIN: OnceLock<TrustChain> = OnceLock::new();

fn get_event_store() -> &'static EventStore {
    EVENT_STORE.get_or_init(|| EventStore::new())
}

fn get_skill_cache() -> &'static SkillCache {
    SKILL_CACHE.get_or_init(|| SkillCache::new(384)) // 384-dim embeddings
}

fn get_trust_chain() -> &'static TrustChain {
    TRUST_CHAIN.get_or_init(|| TrustChain::new())
}

// ============================================================================
// EVENT STORE FFI (Gem 1 - Slim Bridge with Primitives)
// ============================================================================

/// Append batch of events (binary serialized)
/// Input: Buffer containing bincode-serialized Vec<BusEvent>
/// Output: Promise<void>
fn append_event_batch(mut cx: FunctionContext) -> JsResult<JsPromise> {
    let buffer = cx.argument::<JsBuffer>(0)?;
    let data = buffer.as_slice(&cx).to_vec();

    let channel = cx.channel();
    let (deferred, promise) = cx.promise();

    std::thread::spawn(move || {
        let result = (|| -> Result<(), String> {
            let events: Vec<BusEvent> =
                bincode::deserialize(&data).map_err(|e| e.to_string())?;

            let rt = tokio::runtime::Runtime::new().map_err(|e| e.to_string())?;
            rt.block_on(async {
                get_event_store()
                    .append_batch(events)
                    .await
                    .map_err(|e| e.to_string())
            })
        })();

        deferred.settle_with(&channel, move |mut cx| match result {
            Ok(_) => Ok(cx.undefined()),
            Err(e) => cx.throw_error(e),
        });
    });

    Ok(promise)
}

/// Query events by agent_id
/// Input: agent_id (string), pattern (string or null)
/// Output: Promise<Buffer> containing bincode-serialized Vec<BusEvent>
fn query_events(mut cx: FunctionContext) -> JsResult<JsPromise> {
    let agent_id = cx.argument::<JsString>(0)?.value(&mut cx);
    let pattern = cx.argument::<JsValue>(1)?;
    let pattern_str = if pattern.is_a::<JsNull, _>(&mut cx) {
        None
    } else {
        Some(pattern.downcast_or_throw::<JsString, _>(&mut cx)?.value(&mut cx))
    };

    let channel = cx.channel();
    let (deferred, promise) = cx.promise();

    std::thread::spawn(move || {
        let result = (|| -> Result<Vec<u8>, String> {
            let rt = tokio::runtime::Runtime::new().map_err(|e| e.to_string())?;
            let events = rt.block_on(async {
                get_event_store()
                    .query(&agent_id, pattern_str.as_deref())
                    .await
            });

            bincode::serialize(&events).map_err(|e| e.to_string())
        })();

        deferred.settle_with(&channel, move |mut cx| match result {
            Ok(data) => {
                let mut buffer = cx.buffer(data.len())?;
                buffer.as_mut_slice(&mut cx).copy_from_slice(&data);
                Ok(buffer)
            }
            Err(e) => cx.throw_error(e),
        });
    });

    Ok(promise)
}

/// Query events by type
fn query_events_by_type(mut cx: FunctionContext) -> JsResult<JsPromise> {
    let event_type = cx.argument::<JsString>(0)?.value(&mut cx);

    let channel = cx.channel();
    let (deferred, promise) = cx.promise();

    std::thread::spawn(move || {
        let result = (|| -> Result<Vec<u8>, String> {
            let rt = tokio::runtime::Runtime::new().map_err(|e| e.to_string())?;
            let events = rt.block_on(async {
                get_event_store().query_by_type(&event_type).await
            });

            bincode::serialize(&events).map_err(|e| e.to_string())
        })();

        deferred.settle_with(&channel, move |mut cx| match result {
            Ok(data) => {
                let mut buffer = cx.buffer(data.len())?;
                buffer.as_mut_slice(&mut cx).copy_from_slice(&data);
                Ok(buffer)
            }
            Err(e) => cx.throw_error(e),
        });
    });

    Ok(promise)
}

/// Get event count
fn event_count(mut cx: FunctionContext) -> JsResult<JsPromise> {
    let channel = cx.channel();
    let (deferred, promise) = cx.promise();

    std::thread::spawn(move || {
        let result = (|| -> Result<usize, String> {
            let rt = tokio::runtime::Runtime::new().map_err(|e| e.to_string())?;
            Ok(rt.block_on(async { get_event_store().count().await }))
        })();

        deferred.settle_with(&channel, move |mut cx| match result {
            Ok(count) => Ok(cx.number(count as f64)),
            Err(e) => cx.throw_error(e),
        });
    });

    Ok(promise)
}

// ============================================================================
// SKILL CACHE FFI (Gem 2 - SIMD Search)
// ============================================================================

/// Add skill to cache
/// Input: Buffer containing bincode-serialized Skill
/// Output: Promise<void>
fn add_skill(mut cx: FunctionContext) -> JsResult<JsPromise> {
    let buffer = cx.argument::<JsBuffer>(0)?;
    let data = buffer.as_slice(&cx).to_vec();

    let channel = cx.channel();
    let (deferred, promise) = cx.promise();

    std::thread::spawn(move || {
        let result = (|| -> Result<(), String> {
            let skill: Skill = bincode::deserialize(&data).map_err(|e| e.to_string())?;

            let rt = tokio::runtime::Runtime::new().map_err(|e| e.to_string())?;
            rt.block_on(async {
                get_skill_cache()
                    .add_skill(skill)
                    .await
                    .map_err(|e| e.to_string())
            })
        })();

        deferred.settle_with(&channel, move |mut cx| match result {
            Ok(_) => Ok(cx.undefined()),
            Err(e) => cx.throw_error(e),
        });
    });

    Ok(promise)
}

/// SIMD semantic search
/// Input: Float32Array (query embedding), limit (number)
/// Output: Promise<Array<string>> (skill IDs)
fn search_skills(mut cx: FunctionContext) -> JsResult<JsPromise> {
    let array = cx.argument::<JsTypedArray<f32>>(0)?;
    let query_embedding: Vec<f32> = array.as_slice(&cx).to_vec();
    let limit = cx.argument::<JsNumber>(1)?.value(&mut cx) as usize;

    let channel = cx.channel();
    let (deferred, promise) = cx.promise();

    std::thread::spawn(move || {
        let result = (|| -> Result<Vec<String>, String> {
            let rt = tokio::runtime::Runtime::new().map_err(|e| e.to_string())?;
            rt.block_on(async {
                get_skill_cache()
                    .search_simd(&query_embedding, limit)
                    .await
                    .map_err(|e| e.to_string())
            })
        })();

        deferred.settle_with(&channel, move |mut cx| match result {
            Ok(skill_ids) => {
                let js_array = cx.empty_array();
                for (i, id) in skill_ids.iter().enumerate() {
                    let js_string = cx.string(id);
                    js_array.set(&mut cx, i as u32, js_string)?;
                }
                Ok(js_array)
            }
            Err(e) => cx.throw_error(e),
        });
    });

    Ok(promise)
}

/// Get skill by ID
/// Input: skill_id (string)
/// Output: Promise<Buffer> containing bincode-serialized Skill or null
fn get_skill(mut cx: FunctionContext) -> JsResult<JsPromise> {
    let skill_id = cx.argument::<JsString>(0)?.value(&mut cx);

    let channel = cx.channel();
    let (deferred, promise) = cx.promise();

    std::thread::spawn(move || {
        let result = (|| -> Result<Option<Vec<u8>>, String> {
            let rt = tokio::runtime::Runtime::new().map_err(|e| e.to_string())?;
            let skill = rt.block_on(async { get_skill_cache().get_skill(&skill_id).await });

            match skill {
                Some(s) => bincode::serialize(&s)
                    .map(Some)
                    .map_err(|e| e.to_string()),
                None => Ok(None),
            }
        })();

        deferred.settle_with(&channel, move |mut cx| match result {
            Ok(Some(data)) => {
                let mut buffer = cx.buffer(data.len())?;
                buffer.as_mut_slice(&mut cx).copy_from_slice(&data);
                Ok(buffer.upcast())
            }
            Ok(None) => Ok(cx.null().upcast()),
            Err(e) => cx.throw_error(e),
        });
    });

    Ok(promise)
}

/// Update skill statistics
/// Input: skill_id (string), success (boolean), duration_ms (number)
/// Output: Promise<void>
fn update_skill_stats(mut cx: FunctionContext) -> JsResult<JsPromise> {
    let skill_id = cx.argument::<JsString>(0)?.value(&mut cx);
    let success = cx.argument::<JsBoolean>(1)?.value(&mut cx);
    let duration_ms = cx.argument::<JsNumber>(2)?.value(&mut cx) as u64;

    let channel = cx.channel();
    let (deferred, promise) = cx.promise();

    std::thread::spawn(move || {
        let result = (|| -> Result<(), String> {
            let rt = tokio::runtime::Runtime::new().map_err(|e| e.to_string())?;
            rt.block_on(async {
                get_skill_cache()
                    .update_stats(&skill_id, success, duration_ms)
                    .await
                    .map_err(|e| e.to_string())
            })
        })();

        deferred.settle_with(&channel, move |mut cx| match result {
            Ok(_) => Ok(cx.undefined()),
            Err(e) => cx.throw_error(e),
        });
    });

    Ok(promise)
}

// ============================================================================
// TRUST CHAIN FFI (Gem 2 - Batch Verification)
// ============================================================================

/// Register new agent
/// Input: agent_id (string)
/// Output: Promise<Buffer> (public key bytes)
fn register_agent(mut cx: FunctionContext) -> JsResult<JsPromise> {
    let agent_id = cx.argument::<JsString>(0)?.value(&mut cx);

    let channel = cx.channel();
    let (deferred, promise) = cx.promise();

    std::thread::spawn(move || {
        let result = (|| -> Result<Vec<u8>, String> {
            let rt = tokio::runtime::Runtime::new().map_err(|e| e.to_string())?;
            rt.block_on(async {
                get_trust_chain()
                    .register_agent(agent_id)
                    .await
                    .map_err(|e| e.to_string())
            })
        })();

        deferred.settle_with(&channel, move |mut cx| match result {
            Ok(public_key) => {
                let mut buffer = cx.buffer(public_key.len())?;
                buffer.as_mut_slice(&mut cx).copy_from_slice(&public_key);
                Ok(buffer)
            }
            Err(e) => cx.throw_error(e),
        });
    });

    Ok(promise)
}

/// Add trust transaction
/// Input: agent_id (string), delta (number), reason (string), task_hash (string)
/// Output: Promise<string> (transaction hash)
fn add_transaction(mut cx: FunctionContext) -> JsResult<JsPromise> {
    let agent_id = cx.argument::<JsString>(0)?.value(&mut cx);
    let delta = cx.argument::<JsNumber>(1)?.value(&mut cx) as i32;
    let reason = cx.argument::<JsString>(2)?.value(&mut cx);
    let task_hash = cx.argument::<JsString>(3)?.value(&mut cx);

    let channel = cx.channel();
    let (deferred, promise) = cx.promise();

    std::thread::spawn(move || {
        let result = (|| -> Result<String, String> {
            let rt = tokio::runtime::Runtime::new().map_err(|e| e.to_string())?;
            rt.block_on(async {
                get_trust_chain()
                    .add_transaction(agent_id, delta, reason, task_hash)
                    .await
                    .map_err(|e| e.to_string())
            })
        })();

        deferred.settle_with(&channel, move |mut cx| match result {
            Ok(hash) => Ok(cx.string(hash)),
            Err(e) => cx.throw_error(e),
        });
    });

    Ok(promise)
}

/// Verify agent's chain
/// Input: agent_id (string)
/// Output: Promise<boolean>
fn verify_chain(mut cx: FunctionContext) -> JsResult<JsPromise> {
    let agent_id = cx.argument::<JsString>(0)?.value(&mut cx);

    let channel = cx.channel();
    let (deferred, promise) = cx.promise();

    std::thread::spawn(move || {
        let result = (|| -> Result<bool, String> {
            let rt = tokio::runtime::Runtime::new().map_err(|e| e.to_string())?;
            rt.block_on(async {
                get_trust_chain()
                    .verify_chain(&agent_id)
                    .await
                    .map_err(|e| e.to_string())
            })
        })();

        deferred.settle_with(&channel, move |mut cx| match result {
            Ok(valid) => Ok(cx.boolean(valid)),
            Err(e) => cx.throw_error(e),
        });
    });

    Ok(promise)
}

/// Batch verify multiple chains
/// Input: Array<string> (agent IDs)
/// Output: Promise<Object> (map of agent_id -> boolean)
fn verify_batch(mut cx: FunctionContext) -> JsResult<JsPromise> {
    let js_array = cx.argument::<JsArray>(0)?;
    let agent_ids: Vec<String> = js_array
        .to_vec(&mut cx)?
        .iter()
        .filter_map(|v| v.downcast::<JsString, _>(&mut cx).ok())
        .map(|s| s.value(&mut cx))
        .collect();

    let channel = cx.channel();
    let (deferred, promise) = cx.promise();

    std::thread::spawn(move || {
        let result = (|| -> Result<std::collections::HashMap<String, bool>, String> {
            let rt = tokio::runtime::Runtime::new().map_err(|e| e.to_string())?;
            rt.block_on(async {
                get_trust_chain()
                    .verify_batch(&agent_ids)
                    .await
                    .map_err(|e| e.to_string())
            })
        })();

        deferred.settle_with(&channel, move |mut cx| match result {
            Ok(results) => {
                let js_object = cx.empty_object();
                for (agent_id, valid) in results {
                    let key = cx.string(&agent_id);
                    let value = cx.boolean(valid);
                    js_object.set(&mut cx, key, value)?;
                }
                Ok(js_object)
            }
            Err(e) => cx.throw_error(e),
        });
    });

    Ok(promise)
}

/// Get agent's trust score
/// Input: agent_id (string)
/// Output: Promise<number | null>
fn get_trust_score(mut cx: FunctionContext) -> JsResult<JsPromise> {
    let agent_id = cx.argument::<JsString>(0)?.value(&mut cx);

    let channel = cx.channel();
    let (deferred, promise) = cx.promise();

    std::thread::spawn(move || {
        let result = (|| -> Result<Option<i32>, String> {
            let rt = tokio::runtime::Runtime::new().map_err(|e| e.to_string())?;
            Ok(rt.block_on(async { get_trust_chain().get_score(&agent_id).await }))
        })();

        deferred.settle_with(&channel, move |mut cx| match result {
            Ok(Some(score)) => Ok(cx.number(score as f64).upcast()),
            Ok(None) => Ok(cx.null().upcast()),
            Err(e) => cx.throw_error(e),
        });
    });

    Ok(promise)
}

// ============================================================================
// MODULE EXPORTS
// ============================================================================

#[neon::main]
fn main(mut cx: ModuleContext) -> NeonResult<()> {
    // Event Store
    cx.export_function("appendEventBatch", append_event_batch)?;
    cx.export_function("queryEvents", query_events)?;
    cx.export_function("queryEventsByType", query_events_by_type)?;
    cx.export_function("eventCount", event_count)?;

    // Skill Cache
    cx.export_function("addSkill", add_skill)?;
    cx.export_function("searchSkills", search_skills)?;
    cx.export_function("getSkill", get_skill)?;
    cx.export_function("updateSkillStats", update_skill_stats)?;

    // Trust Chain
    cx.export_function("registerAgent", register_agent)?;
    cx.export_function("addTransaction", add_transaction)?;
    cx.export_function("verifyChain", verify_chain)?;
    cx.export_function("verifyBatch", verify_batch)?;
    cx.export_function("getTrustScore", get_trust_score)?;

    Ok(())
}

// Made with Moe Abdelaziz
