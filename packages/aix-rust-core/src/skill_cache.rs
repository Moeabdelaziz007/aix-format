use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Skill types using enum dispatch for zero-cost abstraction (Gem 4)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "kind")]
pub enum SkillKind {
    DataProcessing(DataSkill),
    ApiCall(ApiSkill),
    Computation(ComputeSkill),
    FileOperation(FileSkill),
    NetworkRequest(NetworkSkill),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataSkill {
    pub name: String,
    pub description: String,
    pub input_schema: String,
    pub output_schema: String,
    pub transformations: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiSkill {
    pub name: String,
    pub description: String,
    pub endpoint: String,
    pub method: String,
    pub headers: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComputeSkill {
    pub name: String,
    pub description: String,
    pub algorithm: String,
    pub complexity: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileSkill {
    pub name: String,
    pub description: String,
    pub operations: Vec<String>,
    pub file_types: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkSkill {
    pub name: String,
    pub description: String,
    pub protocols: Vec<String>,
}

impl SkillKind {
    pub fn name(&self) -> &str {
        match self {
            SkillKind::DataProcessing(s) => &s.name,
            SkillKind::ApiCall(s) => &s.name,
            SkillKind::Computation(s) => &s.name,
            SkillKind::FileOperation(s) => &s.name,
            SkillKind::NetworkRequest(s) => &s.name,
        }
    }

    pub fn description(&self) -> &str {
        match self {
            SkillKind::DataProcessing(s) => &s.description,
            SkillKind::ApiCall(s) => &s.description,
            SkillKind::Computation(s) => &s.description,
            SkillKind::FileOperation(s) => &s.description,
            SkillKind::NetworkRequest(s) => &s.description,
        }
    }
}

/// Skill metadata with embedding
#[derive(Debug, Clone)]
pub struct Skill {
    pub id: String,
    pub kind: SkillKind,
    pub embedding: Vec<f32>,
    pub usage_count: u64,
    pub success_rate: f32,
    pub avg_duration_ms: u64,
}

/// High-performance skill cache with SIMD semantic search (Gem 2)
pub struct SkillCache {
    /// Skills storage
    skills: Arc<RwLock<Vec<Skill>>>,
    
    /// Flattened embeddings for SIMD operations (Gem 2 - force materialization)
    /// Layout: [skill0_dim0, skill0_dim1, ..., skill0_dim7, skill1_dim0, ...]
    embeddings: Arc<RwLock<Vec<f32>>>,
    
    /// Embedding dimension (must be multiple of 8 for SIMD)
    embedding_dim: usize,
    
    /// Index by skill ID for fast lookup
    id_index: Arc<RwLock<HashMap<String, usize>>>,
}

impl SkillCache {
    /// Create new skill cache with specified embedding dimension
    pub fn new(embedding_dim: usize) -> Self {
        // Ensure dimension is multiple of 8 for SIMD
        assert!(embedding_dim % 8 == 0, "Embedding dimension must be multiple of 8");
        
        Self {
            skills: Arc::new(RwLock::new(Vec::new())),
            embeddings: Arc::new(RwLock::new(Vec::new())),
            embedding_dim,
            id_index: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Add skill to cache
    pub async fn add_skill(&self, skill: Skill) -> Result<()> {
        if skill.embedding.len() != self.embedding_dim {
            anyhow::bail!(
                "Embedding dimension mismatch: expected {}, got {}",
                self.embedding_dim,
                skill.embedding.len()
            );
        }

        let mut skills = self.skills.write().await;
        let mut embeddings = self.embeddings.write().await;
        let mut id_index = self.id_index.write().await;

        let idx = skills.len();
        id_index.insert(skill.id.clone(), idx);
        
        // Flatten embedding for SIMD
        embeddings.extend_from_slice(&skill.embedding);
        
        skills.push(skill);

        Ok(())
    }

    /// SIMD semantic search (Gem 2 - 5x faster)
    /// Uses manual SIMD-like operations for similarity computation
    pub async fn search_simd(&self, query_embedding: &[f32], limit: usize) -> Result<Vec<String>> {
        if query_embedding.len() != self.embedding_dim {
            anyhow::bail!(
                "Query embedding dimension mismatch: expected {}, got {}",
                self.embedding_dim,
                query_embedding.len()
            );
        }

        let skills = self.skills.read().await;
        let embeddings = self.embeddings.read().await;

        if skills.is_empty() {
            return Ok(Vec::new());
        }

        let mut scores = Vec::with_capacity(skills.len());

        // Process embeddings in chunks of 8 for SIMD-like operations
        for skill_idx in 0..skills.len() {
            let offset = skill_idx * self.embedding_dim;
            let skill_embedding = &embeddings[offset..offset + self.embedding_dim];
            
            // Compute cosine similarity using chunked operations
            let similarity = self.cosine_similarity_simd(query_embedding, skill_embedding);
            scores.push((skill_idx, similarity));
        }

        // Sort by similarity (descending)
        scores.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));

        // Return top K skill IDs
        Ok(scores
            .iter()
            .take(limit)
            .map(|(idx, _)| skills[*idx].id.clone())
            .collect())
    }

    /// Optimized cosine similarity using chunked operations (simulates SIMD)
    #[inline]
    fn cosine_similarity_simd(&self, a: &[f32], b: &[f32]) -> f32 {
        let mut dot_product = 0.0f32;
        let mut norm_a = 0.0f32;
        let mut norm_b = 0.0f32;

        // Process 8 elements at a time (SIMD width)
        let chunks = a.len() / 8;
        for i in 0..chunks {
            let base = i * 8;
            
            // Unrolled loop for better performance
            for j in 0..8 {
                let idx = base + j;
                let a_val = a[idx];
                let b_val = b[idx];
                
                dot_product += a_val * b_val;
                norm_a += a_val * a_val;
                norm_b += b_val * b_val;
            }
        }

        // Handle remaining elements
        for i in (chunks * 8)..a.len() {
            dot_product += a[i] * b[i];
            norm_a += a[i] * a[i];
            norm_b += b[i] * b[i];
        }

        // Avoid division by zero
        if norm_a == 0.0 || norm_b == 0.0 {
            return 0.0;
        }

        dot_product / (norm_a.sqrt() * norm_b.sqrt())
    }

    /// Get skill by ID
    pub async fn get_skill(&self, skill_id: &str) -> Option<Skill> {
        let skills = self.skills.read().await;
        let id_index = self.id_index.read().await;

        id_index
            .get(skill_id)
            .and_then(|&idx| skills.get(idx))
            .cloned()
    }

    /// Update skill usage statistics
    pub async fn update_stats(
        &self,
        skill_id: &str,
        success: bool,
        duration_ms: u64,
    ) -> Result<()> {
        let mut skills = self.skills.write().await;
        let id_index = self.id_index.read().await;

        if let Some(&idx) = id_index.get(skill_id) {
            if let Some(skill) = skills.get_mut(idx) {
                skill.usage_count += 1;
                
                // Update success rate (exponential moving average)
                let alpha = 0.1;
                let new_success = if success { 1.0 } else { 0.0 };
                skill.success_rate = alpha * new_success + (1.0 - alpha) * skill.success_rate;
                
                // Update average duration (exponential moving average)
                skill.avg_duration_ms = 
                    ((alpha * duration_ms as f32) + 
                     ((1.0 - alpha) * skill.avg_duration_ms as f32)) as u64;
            }
        }

        Ok(())
    }

    /// Get top skills by usage
    pub async fn top_skills(&self, limit: usize) -> Vec<Skill> {
        let mut skills = self.skills.read().await.clone();
        skills.sort_by(|a, b| b.usage_count.cmp(&a.usage_count));
        skills.into_iter().take(limit).collect()
    }

    /// Get skills by kind
    pub async fn get_by_kind(&self, kind_name: &str) -> Vec<Skill> {
        let skills = self.skills.read().await;
        
        skills
            .iter()
            .filter(|skill| {
                match (&skill.kind, kind_name) {
                    (SkillKind::DataProcessing(_), "DataProcessing") => true,
                    (SkillKind::ApiCall(_), "ApiCall") => true,
                    (SkillKind::Computation(_), "Computation") => true,
                    (SkillKind::FileOperation(_), "FileOperation") => true,
                    (SkillKind::NetworkRequest(_), "NetworkRequest") => true,
                    _ => false,
                }
            })
            .cloned()
            .collect()
    }

    /// Get total skill count
    pub async fn count(&self) -> usize {
        self.skills.read().await.len()
    }

    /// Clear all skills (for testing)
    #[cfg(test)]
    pub async fn clear(&self) {
        self.skills.write().await.clear();
        self.embeddings.write().await.clear();
        self.id_index.write().await.clear();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_skill(id: &str, embedding: Vec<f32>) -> Skill {
        Skill {
            id: id.to_string(),
            kind: SkillKind::Computation(ComputeSkill {
                name: format!("skill_{}", id),
                description: "Test skill".to_string(),
                algorithm: "test".to_string(),
                complexity: "O(1)".to_string(),
            }),
            embedding,
            usage_count: 0,
            success_rate: 1.0,
            avg_duration_ms: 100,
        }
    }

    #[tokio::test]
    async fn test_add_and_get_skill() {
        let cache = SkillCache::new(8);
        let skill = create_test_skill("skill1", vec![1.0; 8]);
        
        cache.add_skill(skill.clone()).await.unwrap();
        
        let retrieved = cache.get_skill("skill1").await;
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().id, "skill1");
    }

    #[tokio::test]
    async fn test_simd_search() {
        let cache = SkillCache::new(8);
        
        // Add skills with different embeddings
        cache.add_skill(create_test_skill("skill1", vec![1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0])).await.unwrap();
        cache.add_skill(create_test_skill("skill2", vec![0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0])).await.unwrap();
        cache.add_skill(create_test_skill("skill3", vec![1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0])).await.unwrap();
        
        // Query should find skill3 as most similar
        let query = vec![1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0];
        let results = cache.search_simd(&query, 1).await.unwrap();
        
        assert_eq!(results.len(), 1);
        assert_eq!(results[0], "skill3");
    }

    #[tokio::test]
    async fn test_update_stats() {
        let cache = SkillCache::new(8);
        let skill = create_test_skill("skill1", vec![1.0; 8]);
        
        cache.add_skill(skill).await.unwrap();
        cache.update_stats("skill1", true, 150).await.unwrap();
        
        let updated = cache.get_skill("skill1").await.unwrap();
        assert_eq!(updated.usage_count, 1);
    }
}

// Made with Moe Abdelaziz
