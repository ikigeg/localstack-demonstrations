#!/bin/bash

# spin up docker and wait for localstack to be ready with a dummy bucket
docker-compose -f docker-compose.yaml up --build --remove-orphans --exit-code-from example-app
