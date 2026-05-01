use sha2::{Sha256, Digest};
use std::fs;
use std::path::Path;
use anyhow::{Result, Context};

pub fn sign_dna(file_path: &Path) -> Result<String> {
    let content = fs::read_to_string(file_path)
        .with_context(|| format!("Failed to read file: {:?}", file_path))?;

    // Step 1: Create a "clean" version for hashing
    // We replace the genesis_hash value with an empty string to ensure the hash is stable
    let re = regex::Regex::new(r#"(?m)^(\s*genesis_hash:\s*)"[^"]*""#).unwrap();
    let clean_content = re.replace_all(&content, r#"$1"""#);

    // Step 2: Calculate SHA-256
    let mut hasher = Sha256::new();
    hasher.update(clean_content.as_bytes());
    let hash = format!("{:x}", hasher.finalize());

    // Step 3: Update the content with the new hash
    let signed_content = re.replace_all(&content, format!(r#"$1"{}"#"#, hash).as_str());

    fs::write(file_path, signed_content.to_string())
        .with_context(|| format!("Failed to write signed file: {:?}", file_path))?;

    Ok(hash)
}

pub fn verify_dna(file_path: &Path) -> Result<bool> {
    let content = fs::read_to_string(file_path)?;
    
    // Extract existing hash
    let re = regex::Regex::new(r#"(?m)^\s*genesis_hash:\s*"([^"]*)""#).unwrap();
    let existing_hash = re.captures(&content)
        .and_then(|cap| cap.get(1))
        .map(|m| m.as_str())
        .unwrap_or("");

    if existing_hash.is_empty() {
        return Ok(false);
    }

    // Calculate expected hash
    let clean_content = regex::Regex::new(r#"(?m)^(\s*genesis_hash:\s*)"[^"]*""#)
        .unwrap()
        .replace_all(&content, r#"$1"""#);

    let mut hasher = Sha256::new();
    hasher.update(clean_content.as_bytes());
    let calculated_hash = format!("{:x}", hasher.finalize());

    Ok(existing_hash == calculated_hash)
}

pub fn sanitize_identifier(id: &str) -> String {
    let re = regex::Regex::new(r#"[^a-zA-Z0-9\.\-_]"#).unwrap();
    re.replace_all(id, "_").to_string()
}

pub fn validate_workspace(root: &Path, target: &Path) -> Result<bool> {
    let canonical_root = root.canonicalize()
        .with_context(|| format!("Failed to canonicalize root: {:?}", root))?;
    let canonical_target = target.canonicalize()
        .with_context(|| format!("Failed to canonicalize target: {:?}", target))?;

    Ok(canonical_target.starts_with(canonical_root))
}

pub fn is_safe_path(path_str: &str) -> bool {
    // Rule: no \n, \r, \0 in path
    !path_str.contains('\n') && !path_str.contains('\r') && !path_str.contains('\0')
}
