use std::env;
use urms_lib::subsystems::calendar::commands;

#[tokio::main]
async fn main() {
    let args: Vec<String> = env::args().collect();
    if args.len() < 3 {
        eprintln!("Usage: oauth_cli <client_id> <client_secret>");
        std::process::exit(2);
    }
    let client_id = args[1].clone();
    let client_secret = args[2].clone();

    // call the same function implemented in calendar commands
    match commands::calendar_start_oauth(client_id, client_secret).await {
        Ok(val) => println!("OAuth result: {}", val),
        Err(e) => eprintln!("OAuth failed: {}", e),
    }
}
