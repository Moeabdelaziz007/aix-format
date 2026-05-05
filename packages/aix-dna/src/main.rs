// @aix-hint: ring-0-rust.md | Genesis Ring: Immutable DNA and Security logic.
// @aix-hint: ring-0-rust.md | Genesis Ring: Immutable DNA and Security.
use clap::{Parser, Subcommand};
use std::path::PathBuf;
use aix_dna::{sign_dna, verify_dna};

#[derive(Parser)]
#[command(name = "axiom-dna")]
#[command(about = "AIX DNA Signing & Verification Tool", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Sign an AXIOM manifest file
    Sign {
        /// Path to the AXIOM.md file
        #[arg(default_value = "AXIOM.md")]
        path: PathBuf,
    },
    /// Verify the signature of an AXIOM manifest file
    Verify {
        /// Path to the AXIOM.md file
        #[arg(default_value = "AXIOM.md")]
        path: PathBuf,
    },
}

fn main() {
    let cli = Cli::parse();

    match &cli.command {
        Commands::Sign { path } => {
            println!("Signing DNA for: {:?}", path);
            match sign_dna(path) {
                Ok(hash) => println!("Success! Genesis Hash: {}", hash),
                Err(e) => {
                    eprintln!("Error signing DNA: {}", e);
                    std::process::exit(1);
                }
            }
        }
        Commands::Verify { path } => {
            println!("Verifying DNA for: {:?}", path);
            match verify_dna(path) {
                Ok(true) => println!("Verification PASSED."),
                Ok(false) => {
                    println!("Verification FAILED. DNA has been tampered with or not signed.");
                    std::process::exit(1);
                }
                Err(e) => {
                    eprintln!("Error verifying DNA: {}", e);
                    std::process::exit(1);
                }
            }
        }
    }
}
