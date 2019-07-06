#!/bin/bash

# IMPORTANT - this must be sourced rather than executed i.e.
# . aws-assume-role role_arn

# You can do this easily by wrapping it in a bash function in your bashrc, like:
# become() {
#   . aws-assume-role
# }
# Note that if you use env vars to set your default AWS credentials, you'll
# also need to set those again in your enclosing function before sourcing this
# script, as this will override the credentials in your env.

# Breakout is necessary because you can't exit while sourcing a script or
# you'll exit the enclosing login session!
_breakout=0

if [[ -z "${AWS_STS_ENDPOINT}" ]]; then
  ENDPOINT=""
else
  ENDPOINT="--endpoint-url=""${AWS_STS_ENDPOINT}"""
fi

case "$1" in
  arn:*)
    AWS_ROLE="$1"
    ;;
  *)
    echo "Unknown role $1" >&2
    _breakout=1
    ;;
esac

ROLE_SESSION_NAME=${AWS_SESSION_NAME:=$(hostname)}

if [[ "$_breakout" != 1 ]]; then
  unset AWS_SESSION_TOKEN

  echo "Assuming AWS IAM role: $AWS_ROLE"
  CREDS=$(
    aws $ENDPOINT sts assume-role \
      --role-arn "$AWS_ROLE" \
      --role-session-name "$ROLE_SESSION_NAME" |
        jq .Credentials
  )

  ASSUMED_AWS_ACCESS_KEY_ID=$(echo "$CREDS" | jq -r .AccessKeyId)
  ASSUMED_AWS_SECRET_ACCESS_KEY=$(echo "$CREDS" | jq -r .SecretAccessKey)
  ASSUMED_AWS_SESSION_TOKEN=$(echo "$CREDS" | jq -r .SessionToken)
  ASSUMED_AWS_ACCOUNT_ID="$1"

  export ASSUMED_AWS_ACCESS_KEY_ID
  export ASSUMED_AWS_SECRET_ACCESS_KEY
  export ASSUMED_AWS_SESSION_TOKEN
  export ASSUMED_AWS_ACCOUNT_ID
fi

unset _breakout
