use lambda_http::{Body, Error, Request, RequestExt, Response, run, service_fn};

/// This is the main body for the function.
/// Write your code inside it.
/// There are some code example in the following URLs:
/// - https://github.com/awslabs/aws-lambda-rust-runtime/tree/main/examples
async fn function_handler(event: Request) -> Result<Response<Body>, Error> {
  // Extract some useful information from the request
  let who = event
    .query_string_parameters_ref()
    .and_then(|params| params.first("name"))
    .unwrap_or("no find the name");

  // let auth = event.payload.headers.get("authorization");

  let message = format!("Hello {who}, this is an AWS Lambda HTTP request. {auth}");

  // println!(format!("message! {message}"));
  // Return something that implements IntoResponse.
  // It will be serialized to the right response event automatically by the runtime
  let resp = Response::builder()
    .status(200)
    .header("content-type", "text/html")
    .body(message.into())
    .map_err(Box::new)?;
  Ok(resp)
}

#[tokio::main]
async fn main() -> Result<(), Error> {
  println!("In rust update-cognito main.");
  tracing_subscriber::fmt()
    .with_max_level(tracing::Level::INFO)
    // disable printing the name of the module in every log line.
    .with_target(false)
    // disabling time is handy because CloudWatch will add the ingestion time.
    .without_time()
    .init();

  run(service_fn(function_handler)).await
}
