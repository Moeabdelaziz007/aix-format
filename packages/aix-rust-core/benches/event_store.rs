use criterion::{black_box, criterion_group, criterion_main, BenchmarkId, Criterion};
use aix_rust_core::event_store::{AlertSeverity, BusEvent, EventStore};
use std::time::SystemTime;

fn generate_events(count: usize) -> Vec<BusEvent> {
    let timestamp = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .unwrap()
        .as_secs();

    (0..count)
        .map(|i| {
            let event_type = i % 6;
            match event_type {
                0 => BusEvent::TaskSpawned {
                    agent_id: format!("agent_{}", i % 100),
                    task_id: format!("task_{}", i),
                    timestamp: timestamp + i as u64,
                },
                1 => BusEvent::TaskCompleted {
                    agent_id: format!("agent_{}", i % 100),
                    task_id: format!("task_{}", i),
                    result: "success".to_string(),
                    timestamp: timestamp + i as u64,
                },
                2 => BusEvent::SkillExtracted {
                    agent_id: format!("agent_{}", i % 100),
                    skill_id: format!("skill_{}", i),
                    skill_name: format!("Skill {}", i),
                    timestamp: timestamp + i as u64,
                },
                3 => BusEvent::SecurityAlert {
                    agent_id: format!("agent_{}", i % 100),
                    reason: "Test alert".to_string(),
                    severity: AlertSeverity::Low,
                    timestamp: timestamp + i as u64,
                },
                4 => BusEvent::TrustUpdated {
                    agent_id: format!("agent_{}", i % 100),
                    delta: 10,
                    new_score: 100 + (i as i32),
                    timestamp: timestamp + i as u64,
                },
                _ => BusEvent::SkillExecuted {
                    agent_id: format!("agent_{}", i % 100),
                    skill_id: format!("skill_{}", i),
                    duration_ms: 100,
                    success: true,
                    timestamp: timestamp + i as u64,
                },
            }
        })
        .collect()
}

fn bench_append_batch(c: &mut Criterion) {
    let rt = tokio::runtime::Runtime::new().unwrap();
    let mut group = c.benchmark_group("event_store_append");

    for size in [10, 100, 1000, 10000].iter() {
        group.bench_with_input(BenchmarkId::from_parameter(size), size, |b, &size| {
            b.to_async(&rt).iter(|| async {
                let store = EventStore::new();
                let events = generate_events(size);
                store.append_batch(black_box(events)).await.unwrap();
            });
        });
    }

    group.finish();
}

fn bench_query(c: &mut Criterion) {
    let rt = tokio::runtime::Runtime::new().unwrap();
    let store = EventStore::new();

    // Populate store
    rt.block_on(async {
        let events = generate_events(10000);
        store.append_batch(events).await.unwrap();
    });

    let mut group = c.benchmark_group("event_store_query");

    group.bench_function("query_by_agent", |b| {
        b.to_async(&rt).iter(|| async {
            store.query(black_box("agent_50"), None).await
        });
    });

    group.bench_function("query_by_agent_with_pattern", |b| {
        b.to_async(&rt).iter(|| async {
            store.query(black_box("agent_50"), Some("Task")).await
        });
    });

    group.bench_function("query_by_type", |b| {
        b.to_async(&rt).iter(|| async {
            store.query_by_type(black_box("TaskSpawned")).await
        });
    });

    group.finish();
}

fn bench_time_range_query(c: &mut Criterion) {
    let rt = tokio::runtime::Runtime::new().unwrap();
    let store = EventStore::new();

    let timestamp = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .unwrap()
        .as_secs();

    // Populate store
    rt.block_on(async {
        let events = generate_events(10000);
        store.append_batch(events).await.unwrap();
    });

    c.bench_function("event_store_time_range", |b| {
        b.to_async(&rt).iter(|| async {
            store
                .query_by_time_range(
                    black_box(timestamp + 1000),
                    black_box(timestamp + 2000),
                )
                .await
        });
    });
}

criterion_group!(
    benches,
    bench_append_batch,
    bench_query,
    bench_time_range_query
);
criterion_main!(benches);

// Made with Moe Abdelaziz
