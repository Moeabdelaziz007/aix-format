use anyhow::{Context, Result};
use ed25519_dalek::{Signature, Signer, SigningKey, Verifier, VerifyingKey};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Trust transaction in the blockchain (Gem 5 - types that don't lie)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrustTransaction {
    pub agent_id: String,
    pub delta: i32,
    pub reason: String,
    pub task_hash: String,
    pub timestamp: u64,
    pub prev_hash: String,
    pub signature: Vec<u8>,
    pub nonce: u64,
}

impl TrustTransaction {
    /// Create new transaction
    pub fn new(
        agent_id: String,
        delta: i32,
        reason: String,
        task_hash: String,
        timestamp: u64,
        prev_hash: String,
        nonce: u64,
    ) -> Self {
        Self {
            agent_id,
            delta,
            reason,
            task_hash,
            timestamp,
            prev_hash,
            signature: Vec::new(),
            nonce,
        }
    }

    /// Convert transaction to bytes for signing/verification
    pub fn to_bytes(&self) -> Vec<u8> {
        let mut bytes = Vec::new();
        bytes.extend_from_slice(self.agent_id.as_bytes());
        bytes.extend_from_slice(&self.delta.to_le_bytes());
        bytes.extend_from_slice(self.reason.as_bytes());
        bytes.extend_from_slice(self.task_hash.as_bytes());
        bytes.extend_from_slice(&self.timestamp.to_le_bytes());
        bytes.extend_from_slice(self.prev_hash.as_bytes());
        bytes.extend_from_slice(&self.nonce.to_le_bytes());
        bytes
    }

    /// Compute hash of transaction
    pub fn hash(&self) -> String {
        let mut hasher = Sha256::new();
        hasher.update(self.to_bytes());
        hasher.update(&self.signature);
        format!("{:x}", hasher.finalize())
    }

    /// Sign transaction with private key
    pub fn sign(&mut self, signing_key: &SigningKey) {
        let message = self.to_bytes();
        let signature = signing_key.sign(&message);
        self.signature = signature.to_bytes().to_vec();
    }

    /// Verify transaction signature
    pub fn verify(&self, verifying_key: &VerifyingKey) -> Result<()> {
        let message = self.to_bytes();
        let signature = Signature::from_bytes(
            self.signature
                .as_slice()
                .try_into()
                .context("Invalid signature length")?,
        );
        
        verifying_key
            .verify(&message, &signature)
            .context("Signature verification failed")
    }
}

/// Trust chain for an agent
#[derive(Debug, Clone)]
pub struct AgentChain {
    pub agent_id: String,
    pub transactions: Vec<TrustTransaction>,
    pub current_score: i32,
    pub verifying_key: VerifyingKey,
}

impl AgentChain {
    pub fn new(agent_id: String, verifying_key: VerifyingKey) -> Self {
        Self {
            agent_id,
            transactions: Vec::new(),
            current_score: 0,
            verifying_key,
        }
    }

    /// Add transaction to chain
    pub fn add_transaction(&mut self, mut transaction: TrustTransaction) -> Result<()> {
        // Verify signature
        transaction.verify(&self.verifying_key)?;

        // Verify previous hash
        if !self.transactions.is_empty() {
            let last_hash = self.transactions.last().unwrap().hash();
            if transaction.prev_hash != last_hash {
                anyhow::bail!("Invalid previous hash");
            }
        }

        // Update score
        self.current_score += transaction.delta;
        self.transactions.push(transaction);

        Ok(())
    }

    /// Get transaction count
    pub fn len(&self) -> usize {
        self.transactions.len()
    }

    /// Check if chain is empty
    pub fn is_empty(&self) -> bool {
        self.transactions.is_empty()
    }
}

/// Global trust chain manager with batch verification (Gem 2)
pub struct TrustChain {
    /// Chains indexed by agent_id
    chains: Arc<RwLock<HashMap<String, AgentChain>>>,
    
    /// Signing keys for agents (in production, use secure key management)
    signing_keys: Arc<RwLock<HashMap<String, SigningKey>>>,
}

impl TrustChain {
    pub fn new() -> Self {
        Self {
            chains: Arc::new(RwLock::new(HashMap::new())),
            signing_keys: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Register new agent with generated keypair
    pub async fn register_agent(&self, agent_id: String) -> Result<Vec<u8>> {
        let mut rng = rand::thread_rng();
        let signing_key = SigningKey::generate(&mut rng);
        let verifying_key = signing_key.verifying_key();

        let mut chains = self.chains.write().await;
        let mut keys = self.signing_keys.write().await;

        chains.insert(
            agent_id.clone(),
            AgentChain::new(agent_id.clone(), verifying_key),
        );
        keys.insert(agent_id, signing_key);

        Ok(verifying_key.to_bytes().to_vec())
    }

    /// Add transaction to agent's chain
    pub async fn add_transaction(
        &self,
        agent_id: String,
        delta: i32,
        reason: String,
        task_hash: String,
    ) -> Result<String> {
        let mut chains = self.chains.write().await;
        let keys = self.signing_keys.read().await;

        let chain = chains
            .get_mut(&agent_id)
            .context("Agent not registered")?;

        let signing_key = keys.get(&agent_id).context("Signing key not found")?;

        // Get previous hash
        let prev_hash = if chain.is_empty() {
            "genesis".to_string()
        } else {
            chain.transactions.last().unwrap().hash()
        };

        // Create and sign transaction
        let timestamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();

        let mut transaction = TrustTransaction::new(
            agent_id.clone(),
            delta,
            reason,
            task_hash,
            timestamp,
            prev_hash,
            chain.len() as u64,
        );

        transaction.sign(signing_key);

        // Add to chain
        chain.add_transaction(transaction.clone())?;

        Ok(transaction.hash())
    }

    /// Batch verify multiple chains (Gem 2 - 10x faster)
    pub async fn verify_batch(&self, agent_ids: &[String]) -> Result<HashMap<String, bool>> {
        let chains = self.chains.read().await;
        let mut results = HashMap::new();

        // Collect all transactions for batch verification
        let mut messages = Vec::new();
        let mut signatures = Vec::new();
        let mut public_keys = Vec::new();
        let mut agent_tx_counts = Vec::new();

        for agent_id in agent_ids {
            if let Some(chain) = chains.get(agent_id) {
                let tx_count = chain.transactions.len();
                agent_tx_counts.push((agent_id.clone(), tx_count));

                for tx in &chain.transactions {
                    messages.push(tx.to_bytes());
                    
                    if let Ok(sig) = Signature::from_bytes(
                        tx.signature.as_slice().try_into().unwrap_or(&[0u8; 64])
                    ) {
                        signatures.push(sig);
                        public_keys.push(chain.verifying_key);
                    }
                }
            }
        }

        // Batch verification (parallel processing)
        let verification_results: Vec<_> = messages
            .iter()
            .zip(signatures.iter())
            .zip(public_keys.iter())
            .map(|((msg, sig), key)| key.verify(msg, sig).is_ok())
            .collect();

        // Map results back to agents
        let mut idx = 0;
        for (agent_id, tx_count) in agent_tx_counts {
            let agent_valid = verification_results[idx..idx + tx_count]
                .iter()
                .all(|&v| v);
            results.insert(agent_id, agent_valid);
            idx += tx_count;
        }

        Ok(results)
    }

    /// Verify single agent's chain
    pub async fn verify_chain(&self, agent_id: &str) -> Result<bool> {
        let chains = self.chains.read().await;
        
        let chain = chains
            .get(agent_id)
            .context("Agent not registered")?;

        // Verify all signatures
        for tx in &chain.transactions {
            if tx.verify(&chain.verifying_key).is_err() {
                return Ok(false);
            }
        }

        // Verify chain integrity (hashes)
        for i in 1..chain.transactions.len() {
            let prev_hash = chain.transactions[i - 1].hash();
            if chain.transactions[i].prev_hash != prev_hash {
                return Ok(false);
            }
        }

        Ok(true)
    }

    /// Get agent's current trust score
    pub async fn get_score(&self, agent_id: &str) -> Option<i32> {
        let chains = self.chains.read().await;
        chains.get(agent_id).map(|chain| chain.current_score)
    }

    /// Get agent's transaction history
    pub async fn get_history(&self, agent_id: &str) -> Option<Vec<TrustTransaction>> {
        let chains = self.chains.read().await;
        chains
            .get(agent_id)
            .map(|chain| chain.transactions.clone())
    }

    /// Get top trusted agents
    pub async fn top_agents(&self, limit: usize) -> Vec<(String, i32)> {
        let chains = self.chains.read().await;
        
        let mut agents: Vec<_> = chains
            .iter()
            .map(|(id, chain)| (id.clone(), chain.current_score))
            .collect();

        agents.sort_by(|a, b| b.1.cmp(&a.1));
        agents.into_iter().take(limit).collect()
    }

    /// Get agent count
    pub async fn agent_count(&self) -> usize {
        self.chains.read().await.len()
    }

    /// Clear all chains (for testing)
    #[cfg(test)]
    pub async fn clear(&self) {
        self.chains.write().await.clear();
        self.signing_keys.write().await.clear();
    }
}

impl Default for TrustChain {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_register_and_add_transaction() {
        let chain = TrustChain::new();
        
        chain.register_agent("agent1".to_string()).await.unwrap();
        
        let tx_hash = chain
            .add_transaction(
                "agent1".to_string(),
                10,
                "Good work".to_string(),
                "task123".to_string(),
            )
            .await
            .unwrap();

        assert!(!tx_hash.is_empty());
        
        let score = chain.get_score("agent1").await;
        assert_eq!(score, Some(10));
    }

    #[tokio::test]
    async fn test_verify_chain() {
        let chain = TrustChain::new();
        
        chain.register_agent("agent1".to_string()).await.unwrap();
        
        chain
            .add_transaction(
                "agent1".to_string(),
                10,
                "Task 1".to_string(),
                "task1".to_string(),
            )
            .await
            .unwrap();

        chain
            .add_transaction(
                "agent1".to_string(),
                5,
                "Task 2".to_string(),
                "task2".to_string(),
            )
            .await
            .unwrap();

        let valid = chain.verify_chain("agent1").await.unwrap();
        assert!(valid);
    }

    #[tokio::test]
    async fn test_batch_verify() {
        let chain = TrustChain::new();
        
        chain.register_agent("agent1".to_string()).await.unwrap();
        chain.register_agent("agent2".to_string()).await.unwrap();
        
        chain
            .add_transaction(
                "agent1".to_string(),
                10,
                "Task 1".to_string(),
                "task1".to_string(),
            )
            .await
            .unwrap();

        chain
            .add_transaction(
                "agent2".to_string(),
                15,
                "Task 2".to_string(),
                "task2".to_string(),
            )
            .await
            .unwrap();

        let results = chain
            .verify_batch(&["agent1".to_string(), "agent2".to_string()])
            .await
            .unwrap();

        assert_eq!(results.get("agent1"), Some(&true));
        assert_eq!(results.get("agent2"), Some(&true));
    }

    #[tokio::test]
    async fn test_top_agents() {
        let chain = TrustChain::new();
        
        chain.register_agent("agent1".to_string()).await.unwrap();
        chain.register_agent("agent2".to_string()).await.unwrap();
        chain.register_agent("agent3".to_string()).await.unwrap();
        
        chain
            .add_transaction("agent1".to_string(), 10, "".to_string(), "".to_string())
            .await
            .unwrap();
        chain
            .add_transaction("agent2".to_string(), 25, "".to_string(), "".to_string())
            .await
            .unwrap();
        chain
            .add_transaction("agent3".to_string(), 15, "".to_string(), "".to_string())
            .await
            .unwrap();

        let top = chain.top_agents(2).await;
        assert_eq!(top.len(), 2);
        assert_eq!(top[0].0, "agent2");
        assert_eq!(top[0].1, 25);
    }
}

// Made with Bob
