use criterion::{black_box, criterion_group, criterion_main, BenchmarkId, Criterion};
use aix_rust_core::trust_chain::TrustChain;

fn bench_register_agent(c: &mut Criterion) {
    let rt = tokio::runtime::Runtime::new().unwrap();

    let mut group = c.benchmark_group("trust_chain_register");

    for count in [10, 100, 1000].iter() {
        group.bench_with_input(BenchmarkId::from_parameter(count), count, |b, &count| {
            b.to_async(&rt).iter(|| async {
                let chain = TrustChain::new();
                for i in 0..count {
                    chain
                        .register_agent(black_box(format!("agent_{}", i)))
                        .await
                        .unwrap();
                }
            });
        });
    }

    group.finish();
}

fn bench_add_transaction(c: &mut Criterion) {
    let rt = tokio::runtime::Runtime::new().unwrap();
    let chain = TrustChain::new();

    // Register agents
    rt.block_on(async {
        for i in 0..100 {
            chain
                .register_agent(format!("agent_{}", i))
                .await
                .unwrap();
        }
    });

    let mut group = c.benchmark_group("trust_chain_add_transaction");

    for count in [10, 100, 1000].iter() {
        group.bench_with_input(BenchmarkId::from_parameter(count), count, |b, &count| {
            b.to_async(&rt).iter(|| async {
                for i in 0..count {
                    chain
                        .add_transaction(
                            black_box(format!("agent_{}", i % 100)),
                            black_box(10),
                            black_box("Good work".to_string()),
                            black_box(format!("task_{}", i)),
                        )
                        .await
                        .unwrap();
                }
            });
        });
    }

    group.finish();
}

fn bench_verify_chain(c: &mut Criterion) {
    let rt = tokio::runtime::Runtime::new().unwrap();
    let chain = TrustChain::new();

    // Setup: Register agent and add transactions
    rt.block_on(async {
        chain.register_agent("agent_test".to_string()).await.unwrap();
        
        for i in 0..100 {
            chain
                .add_transaction(
                    "agent_test".to_string(),
                    10,
                    format!("Task {}", i),
                    format!("task_{}", i),
                )
                .await
                .unwrap();
        }
    });

    c.bench_function("trust_chain_verify_single", |b| {
        b.to_async(&rt).iter(|| async {
            chain.verify_chain(black_box("agent_test")).await.unwrap()
        });
    });
}

fn bench_verify_batch(c: &mut Criterion) {
    let rt = tokio::runtime::Runtime::new().unwrap();
    let chain = TrustChain::new();

    // Setup: Register multiple agents with transactions
    rt.block_on(async {
        for i in 0..100 {
            let agent_id = format!("agent_{}", i);
            chain.register_agent(agent_id.clone()).await.unwrap();
            
            // Add 10 transactions per agent
            for j in 0..10 {
                chain
                    .add_transaction(
                        agent_id.clone(),
                        10,
                        format!("Task {}", j),
                        format!("task_{}_{}", i, j),
                    )
                    .await
                    .unwrap();
            }
        }
    });

    let mut group = c.benchmark_group("trust_chain_verify_batch");

    for batch_size in [10, 50, 100].iter() {
        group.bench_with_input(
            BenchmarkId::from_parameter(batch_size),
            batch_size,
            |b, &batch_size| {
                let agent_ids: Vec<String> = (0..batch_size)
                    .map(|i| format!("agent_{}", i))
                    .collect();

                b.to_async(&rt).iter(|| async {
                    chain.verify_batch(black_box(&agent_ids)).await.unwrap()
                });
            },
        );
    }

    group.finish();
}

fn bench_get_score(c: &mut Criterion) {
    let rt = tokio::runtime::Runtime::new().unwrap();
    let chain = TrustChain::new();

    // Setup
    rt.block_on(async {
        chain.register_agent("agent_test".to_string()).await.unwrap();
        
        for i in 0..100 {
            chain
                .add_transaction(
                    "agent_test".to_string(),
                    10,
                    format!("Task {}", i),
                    format!("task_{}", i),
                )
                .await
                .unwrap();
        }
    });

    c.bench_function("trust_chain_get_score", |b| {
        b.to_async(&rt).iter(|| async {
            chain.get_score(black_box("agent_test")).await
        });
    });
}

fn bench_cryptographic_operations(c: &mut Criterion) {
    let rt = tokio::runtime::Runtime::new().unwrap();
    let chain = TrustChain::new();

    // Register agent to get keys
    rt.block_on(async {
        chain.register_agent("agent_crypto".to_string()).await.unwrap();
    });

    let mut group = c.benchmark_group("trust_chain_crypto");

    // Benchmark transaction signing and verification
    group.bench_function("sign_and_verify", |b| {
        b.to_async(&rt).iter(|| async {
            chain
                .add_transaction(
                    black_box("agent_crypto".to_string()),
                    black_box(10),
                    black_box("Crypto test".to_string()),
                    black_box("task_crypto".to_string()),
                )
                .await
                .unwrap();
        });
    });

    group.finish();
}

criterion_group!(
    benches,
    bench_register_agent,
    bench_add_transaction,
    bench_verify_chain,
    bench_verify_batch,
    bench_get_score,
    bench_cryptographic_operations
);
criterion_main!(benches);

// Made with Moe Abdelaziz
