#!/bin/bash

# This variable will override the role assuming scrips endpoint
export AWS_STS_ENDPOINT="http://localhost:4592"

ROLE_TO_ASSUME=${AWS_ROLE:-arn:aws:iam::123456789012:role/demo}

echo "Assuming ${ROLE_TO_ASSUME}"
. ../../useful/awscli_assume_role.sh ${ROLE_TO_ASSUME}

if [ -z "$ASSUMED_AWS_SESSION_TOKEN" ]
then
  echo "Exiting early because of missing AWS credentials"
  exit 1
fi

# Call our node script that will check process.env for the required credentials
node index.js