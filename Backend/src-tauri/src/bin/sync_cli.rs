use std::env;

#[tokio::main]
async fn main() {
    let args: Vec<String> = env::args().collect();
    if args.len() < 2 {
        eprintln!("Usage: sync_cli <calendar_id> [max_results]");
        std::process::exit(2);
    }
    let calendar_id = args[1].clone();
    let max_results = if args.len() >= 3 { args[2].parse::<u32>().ok() } else { None };

    match urms_lib::subsystems::calendar::commands::calendar_sync_with_oauth(calendar_id, max_results).await {
        Ok(events) => {
            println!("Got {} events", events.len());
            match serde_json::to_string_pretty(&events) {
                Ok(s) => println!("{}", s),
                Err(_) => println!("(failed to serialize events)")
            }
        }
        Err(e) => {
            eprintln!("Sync failed: {}", e);
            std::process::exit(1);
        }
    }
}
