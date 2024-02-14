# Champion / FitNest MVP

This repository contains the code / libraries to build an AWS Serverless environment that serves an Angular application and the infrastructure defined in the CDK package.

## Building

### Build the Angular Application
ng build --configuration=dev

### Building RUST Lambda Functions
cargo lambda build -- Todo, this needs attention

### Building TS Lambda Functions
Currently configured to happen in the synth process.

### Building/Synthing the CDK Project
cdk synth --profile wagonercli --debug


## Deploying
aws sso login --profile wagonercli
cdk deploy --profile wagonercli --debug --require-approval never



<!--

# BEGIN GENERATED CONTENT

# ChampionMvp

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 17.0.1.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
-->