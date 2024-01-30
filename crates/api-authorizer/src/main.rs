use lambda_http::{run, service_fn, Body, Error, Request, RequestExt, Response};

/// This is the main body for the function.
/// Write your code inside it.
/// There are some code example in the following URLs:
/// - https://github.com/awslabs/aws-lambda-rust-runtime/tree/main/examples
async fn function_handler(event: Request) -> Result<Response<Body>, Error> {
  // Extract some useful information from the request
  println!("Rust calling function_handler!");
  let who = event
    .query_string_parameters_ref()
    .and_then(|params| params.first("name"))
    .unwrap_or("world");
  println!("Rust creating who");
  let message = format!("Hello {who}, this is an AWS Lambda HTTP request");

  // let token = event.payload.headers.get("authorization");
  // let token = event.params("Authorization");
  orry
  let token = event.headers().get("Authorization");
  println!("Rust creating resp");
  let resp = Response::builder()
    .status(200)
    .header("content-type", "text/html")
    .body(message.into())
    .map_err(Box::new)?;
  println!("Rust calling ok");
  Ok(resp)

  // let errResp = Response::builder()
  // .status(200)
  // .header("content-type", "text/html")
  // .body(message.into())
  // .map_err(Box::new)?;
  // Err(errResp)
}

#[tokio::main]
async fn main() -> Result<(), Error> {
  println!("Rust main()");
  tracing_subscriber::fmt()
    .with_max_level(tracing::Level::INFO)
    // disable printing the name of the module in every log line.
    .with_target(false)
    // disabling time is handy because CloudWatch will add the ingestion time.
    .without_time()
    .init();

  println!("Rust main calling run");
  run(service_fn(function_handler)).await
}
