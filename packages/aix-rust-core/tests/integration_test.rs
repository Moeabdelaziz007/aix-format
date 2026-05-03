use aix_rust_core::event_store::{AlertSeverity, BusEvent, EventStore};
use aix_rust_core::skill_cache::{ComputeSkill, Skill, SkillCache, SkillKind};
use aix_rust_core::trust_chain::TrustChain;

// ============================================================================
// Event Store Integration Tests
// ============================================================================

#[tokio::test]
async fn test_event_store_full_workflow() {
    let store = EventStore::new();

    // Create diverse events
    let events = vec![
        BusEvent::TaskSpawned {
            agent_id: "agent1".to_string(),
            task_id: "task1".to_string(),
            timestamp: 1000,
        },
        BusEvent::TaskCompleted {
            agent_id: "agent1".to_string(),
            task_id: "task1".to_string(),
            result: "success".to_string(),
            timestamp: 2000,
        },
        BusEvent::SkillExtracted {
            agent_id: "agent1".to_string(),
            skill_id: "skill1".to_string(),
            skill_name: "Data Processing".to_string(),
            timestamp: 3000,
        },
        BusEvent::SecurityAlert {
            agent_id: "agent2".to_string(),
            reason: "Suspicious activity".to_string(),
            severity: AlertSeverity::High,
            timestamp: 4000,
        },
    ];

    // Batch append
    store.append_batch(events).await.unwrap();

    // Query by agent
    let agent1_events = store.query("agent1", None).await;
    assert_eq!(agent1_events.len(), 3);

    // Query with pattern
    let task_events = store.query("agent1", Some("Task")).await;
    assert_eq!(task_events.len(), 2);

    // Query by type
    let alerts = store.query_by_type("SecurityAlert").await;
    assert_eq!(alerts.len(), 1);

    // Time range query
    let range_events = store.query_by_time_range(1500, 3500).await;
    assert_eq!(range_events.len(), 2);

    // Count
    assert_eq!(store.count().await, 4);
    assert_eq!(store.count_by_agent("agent1").await, 3);
}

#[tokio::test]
async fn test_event_store_large_batch() {
    let store = EventStore::new();

    // Create 10,000 events
    let events: Vec<_> = (0..10000)
        .map(|i| BusEvent::TaskSpawned {
            agent_id: format!("agent_{}", i % 100),
            task_id: format!("task_{}", i),
            timestamp: 1000 + i as u64,
        })
        .collect();

    // Batch append should be fast
    let start = std::time::Instant::now();
    store.append_batch(events).await.unwrap();
    let duration = start.elapsed();

    println!("Appended 10,000 events in {:?}", duration);
    assert!(duration.as_millis() < 100); // Should be < 100ms

    // Verify count
    assert_eq!(store.count().await, 10000);
}

// ============================================================================
// Skill Cache Integration Tests
// ============================================================================

#[tokio::test]
async fn test_skill_cache_full_workflow() {
    let cache = SkillCache::new(8); // 8-dim for testing

    // Add skills
    let skill1 = Skill {
        id: "skill1".to_string(),
        kind: SkillKind::Computation(ComputeSkill {
            name: "Fast Sort".to_string(),
            description: "Quick sort algorithm".to_string(),
            algorithm: "quicksort".to_string(),
            complexity: "O(n log n)".to_string(),
        }),
        embedding: vec![1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
        usage_count: 0,
        success_rate: 1.0,
        avg_duration_ms: 100,
    };

    let skill2 = Skill {
        id: "skill2".to_string(),
        kind: SkillKind::Computation(ComputeSkill {
            name: "Binary Search".to_string(),
            description: "Binary search algorithm".to_string(),
            algorithm: "binary_search".to_string(),
            complexity: "O(log n)".to_string(),
        }),
        embedding: vec![0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
        usage_count: 0,
        success_rate: 1.0,
        avg_duration_ms: 50,
    };

    let skill3 = Skill {
        id: "skill3".to_string(),
        kind: SkillKind::Computation(ComputeSkill {
            name: "Merge Sort".to_string(),
            description: "Merge sort algorithm".to_string(),
            algorithm: "mergesort".to_string(),
            complexity: "O(n log n)".to_string(),
        }),
        embedding: vec![1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
        usage_count: 0,
        success_rate: 1.0,
        avg_duration_ms: 120,
    };

    cache.add_skill(skill1).await.unwrap();
    cache.add_skill(skill2).await.unwrap();
    cache.add_skill(skill3).await.unwrap();

    // SIMD search - should find skill3 as most similar
    let query = vec![1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0];
    let results = cache.search_simd(&query, 2).await.unwrap();
    assert_eq!(results.len(), 2);
    assert_eq!(results[0], "skill3");

    // Get skill
    let retrieved = cache.get_skill("skill1").await;
    assert!(retrieved.is_some());
    assert_eq!(retrieved.unwrap().id, "skill1");

    // Update stats
    cache.update_stats("skill1", true, 150).await.unwrap();
    let updated = cache.get_skill("skill1").await.unwrap();
    assert_eq!(updated.usage_count, 1);

    // Count
    assert_eq!(cache.count().await, 3);
}

#[tokio::test]
async fn test_skill_cache_simd_performance() {
    let cache = SkillCache::new(384); // Standard embedding size

    // Add 1000 skills
    for i in 0..1000 {
        let embedding: Vec<f32> = (0..384)
            .map(|j| ((i + j) as f32 * 0.1).sin())
            .collect();

        let skill = Skill {
            id: format!("skill_{}", i),
            kind: SkillKind::Computation(ComputeSkill {
                name: format!("Skill {}", i),
                description: "Test skill".to_string(),
                algorithm: "test".to_string(),
                complexity: "O(1)".to_string(),
            }),
            embedding,
            usage_count: 0,
            success_rate: 1.0,
            avg_duration_ms: 100,
        };

        cache.add_skill(skill).await.unwrap();
    }

    // SIMD search should be fast
    let query: Vec<f32> = (0..384).map(|i| (i as f32 * 0.1).cos()).collect();
    
    let start = std::time::Instant::now();
    let results = cache.search_simd(&query, 10).await.unwrap();
    let duration = start.elapsed();

    println!("SIMD search on 1000 skills took {:?}", duration);
    assert!(duration.as_millis() < 10); // Should be < 10ms
    assert_eq!(results.len(), 10);
}

// ============================================================================
// Trust Chain Integration Tests
// ============================================================================

#[tokio::test]
async fn test_trust_chain_full_workflow() {
    let chain = TrustChain::new();

    // Register agents
    let pub_key1 = chain.register_agent("agent1".to_string()).await.unwrap();
    let pub_key2 = chain.register_agent("agent2".to_string()).await.unwrap();

    assert_eq!(pub_key1.len(), 32); // Ed25519 public key size
    assert_eq!(pub_key2.len(), 32);

    // Add transactions
    let tx1_hash = chain
        .add_transaction(
            "agent1".to_string(),
            10,
            "Good work".to_string(),
            "task1".to_string(),
        )
        .await
        .unwrap();

    let tx2_hash = chain
        .add_transaction(
            "agent1".to_string(),
            5,
            "Another task".to_string(),
            "task2".to_string(),
        )
        .await
        .unwrap();

    let tx3_hash = chain
        .add_transaction(
            "agent2".to_string(),
            -5,
            "Bad behavior".to_string(),
            "task3".to_string(),
        )
        .await
        .unwrap();

    assert!(!tx1_hash.is_empty());
    assert!(!tx2_hash.is_empty());
    assert!(!tx3_hash.is_empty());

    // Check scores
    assert_eq!(chain.get_score("agent1").await, Some(15));
    assert_eq!(chain.get_score("agent2").await, Some(-5));

    // Verify chains
    assert!(chain.verify_chain("agent1").await.unwrap());
    assert!(chain.verify_chain("agent2").await.unwrap());

    // Batch verify
    let results = chain
        .verify_batch(&["agent1".to_string(), "agent2".to_string()])
        .await
        .unwrap();

    assert_eq!(results.get("agent1"), Some(&true));
    assert_eq!(results.get("agent2"), Some(&true));
}

#[tokio::test]
async fn test_trust_chain_batch_verification() {
    let chain = TrustChain::new();

    // Register 100 agents
    for i in 0..100 {
        chain
            .register_agent(format!("agent_{}", i))
            .await
            .unwrap();
    }

    // Add transactions for each agent
    for i in 0..100 {
        for j in 0..10 {
            chain
                .add_transaction(
                    format!("agent_{}", i),
                    10,
                    format!("Task {}", j),
                    format!("task_{}_{}", i, j),
                )
                .await
                .unwrap();
        }
    }

    // Batch verify should be fast
    let agent_ids: Vec<String> = (0..100).map(|i| format!("agent_{}", i)).collect();

    let start = std::time::Instant::now();
    let results = chain.verify_batch(&agent_ids).await.unwrap();
    let duration = start.elapsed();

    println!("Batch verified 100 chains in {:?}", duration);
    assert!(duration.as_millis() < 100); // Should be < 100ms

    // All should be valid
    assert_eq!(results.len(), 100);
    assert!(results.values().all(|&v| v));
}

// ============================================================================
// Cross-Component Integration Tests
// ============================================================================

#[tokio::test]
async fn test_full_system_integration() {
    let event_store = EventStore::new();
    let skill_cache = SkillCache::new(8);
    let trust_chain = TrustChain::new();

    // Register agent
    trust_chain
        .register_agent("agent1".to_string())
        .await
        .unwrap();

    // Add skill
    let skill = Skill {
        id: "skill1".to_string(),
        kind: SkillKind::Computation(ComputeSkill {
            name: "Test Skill".to_string(),
            description: "Integration test skill".to_string(),
            algorithm: "test".to_string(),
            complexity: "O(1)".to_string(),
        }),
        embedding: vec![1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
        usage_count: 0,
        success_rate: 1.0,
        avg_duration_ms: 100,
    };

    skill_cache.add_skill(skill).await.unwrap();

    // Simulate task execution workflow
    let events = vec![
        BusEvent::TaskSpawned {
            agent_id: "agent1".to_string(),
            task_id: "task1".to_string(),
            timestamp: 1000,
        },
        BusEvent::SkillExecuted {
            agent_id: "agent1".to_string(),
            skill_id: "skill1".to_string(),
            duration_ms: 150,
            success: true,
            timestamp: 1100,
        },
        BusEvent::TaskCompleted {
            agent_id: "agent1".to_string(),
            task_id: "task1".to_string(),
            result: "success".to_string(),
            timestamp: 1200,
        },
        BusEvent::TrustUpdated {
            agent_id: "agent1".to_string(),
            delta: 10,
            new_score: 10,
            timestamp: 1300,
        },
    ];

    // Record events
    event_store.append_batch(events).await.unwrap();

    // Update skill stats
    skill_cache
        .update_stats("skill1", true, 150)
        .await
        .unwrap();

    // Add trust transaction
    trust_chain
        .add_transaction(
            "agent1".to_string(),
            10,
            "Successful task completion".to_string(),
            "task1".to_string(),
        )
        .await
        .unwrap();

    // Verify all components
    assert_eq!(event_store.count().await, 4);
    assert_eq!(skill_cache.count().await, 1);
    assert_eq!(trust_chain.get_score("agent1").await, Some(10));

    let updated_skill = skill_cache.get_skill("skill1").await.unwrap();
    assert_eq!(updated_skill.usage_count, 1);

    assert!(trust_chain.verify_chain("agent1").await.unwrap());
}

// Made with Moe Abdelaziz
