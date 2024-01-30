use aws_lambda_events::event::s3::S3Event;
use lambda_runtime::{run, service_fn, Error, LambdaEvent};


/// This is the main body for the function.
/// Write your code inside it.
/// There are some code example in the following URLs:
/// - https://github.com/awslabs/aws-lambda-rust-runtime/tree/main/examples
/// - https://github.com/aws-samples/serverless-rust-demo/
async fn function_handler(event: LambdaEvent<S3Event>) -> Result<(), Error> {
  // Extract some useful information from the request

  println!("RustCfLogger function_handler");
  Ok(())
}

#[tokio::main]
async fn main() -> Result<(), Error> {
  println!("RustCfLogger main");
  tracing_subscriber::fmt()
    .with_max_level(tracing::Level::INFO)
    // disable printing the name of the module in every log line.
    .with_target(false)
    // disabling time is handy because CloudWatch will add the ingestion time.
    .without_time()
    .init();

  println!("RustCfLogger main calling run");
  run(service_fn(function_handler)).await
}
